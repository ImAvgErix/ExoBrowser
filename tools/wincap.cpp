// wincap <window class | #handle> <out.png>: one frame of a window through Windows.Graphics.Capture,
// which reads the window's own content even while other windows cover it. "#123456" picks a window by
// its handle (two windows of one class: the browser and a test copy of it).
#include <windows.h>
#include <d3d11.h>
#include <dxgi.h>
#include <wincodec.h>
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Graphics.Capture.h>
#include <winrt/Windows.Graphics.DirectX.h>
#include <winrt/Windows.Graphics.DirectX.Direct3D11.h>
#include <windows.graphics.capture.interop.h>
#include <windows.graphics.directx.direct3d11.interop.h>
#include <cstdio>

using namespace winrt;
using namespace winrt::Windows::Graphics::Capture;
using namespace winrt::Windows::Graphics::DirectX;

static int Capture(int argc, wchar_t** argv) {
    if (argc < 3) { fwprintf(stderr, L"usage: wincap <class> <out.png>\n"); return 2; }
    init_apartment(apartment_type::multi_threaded);
    HWND hwnd = argv[1][0] == L'#' ? (HWND)(INT_PTR)_wtoi64(argv[1] + 1) : FindWindowW(argv[1], nullptr);
    if (!hwnd || IsIconic(hwnd)) { fwprintf(stderr, L"window not found or minimized\n"); return 1; }

    com_ptr<ID3D11Device> d3d;
    com_ptr<ID3D11DeviceContext> ctx;
    check_hresult(D3D11CreateDevice(nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr, D3D11_CREATE_DEVICE_BGRA_SUPPORT,
                                    nullptr, 0, D3D11_SDK_VERSION, d3d.put(), nullptr, ctx.put()));
    com_ptr<::IInspectable> inspectable;
    check_hresult(CreateDirect3D11DeviceFromDXGIDevice(d3d.as<IDXGIDevice>().get(), inspectable.put()));
    auto device = inspectable.as<Direct3D11::IDirect3DDevice>();

    auto interop = get_activation_factory<GraphicsCaptureItem, IGraphicsCaptureItemInterop>();
    GraphicsCaptureItem item{nullptr};
    check_hresult(interop->CreateForWindow(hwnd, guid_of<GraphicsCaptureItem>(), put_abi(item)));
    auto pool = Direct3D11CaptureFramePool::CreateFreeThreaded(device, DirectXPixelFormat::B8G8R8A8UIntNormalized, 2, item.Size());
    auto session = pool.CreateCaptureSession(item);
    session.IsCursorCaptureEnabled(false);
    try { session.IsBorderRequired(false); } catch (...) {}

    handle ready{CreateEventW(nullptr, TRUE, FALSE, nullptr)};
    Direct3D11CaptureFrame frame{nullptr};
    int seen = 0;
    pool.FrameArrived([&](Direct3D11CaptureFramePool const& p, auto&&) {
        auto f = p.TryGetNextFrame();

        if (!seen++) { frame = f; SetEvent(ready.get()); }
    });
    session.StartCapture();
    if (WaitForSingleObject(ready.get(), 4000) != WAIT_OBJECT_0) { fwprintf(stderr, L"no frame\n"); return 1; }

    com_ptr<ID3D11Texture2D> tex;
    auto access = frame.Surface().as<::Windows::Graphics::DirectX::Direct3D11::IDirect3DDxgiInterfaceAccess>();
    check_hresult(access->GetInterface(IID_PPV_ARGS(tex.put())));
    D3D11_TEXTURE2D_DESC desc;
    tex->GetDesc(&desc);
    desc.Usage = D3D11_USAGE_STAGING;
    desc.BindFlags = 0;
    desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
    desc.MiscFlags = 0;
    com_ptr<ID3D11Texture2D> staging;
    check_hresult(d3d->CreateTexture2D(&desc, nullptr, staging.put()));
    ctx->CopyResource(staging.get(), tex.get());
    D3D11_MAPPED_SUBRESOURCE map;
    check_hresult(ctx->Map(staging.get(), 0, D3D11_MAP_READ, 0, &map));
    for (UINT y = 0; y < desc.Height; y++) {
        BYTE* row = (BYTE*)map.pData + y * map.RowPitch;
        for (UINT x = 0; x < desc.Width; x++) row[x * 4 + 3] = 255;
    }

    com_ptr<IWICImagingFactory> wic;
    check_hresult(CoCreateInstance(CLSID_WICImagingFactory, nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(wic.put())));
    com_ptr<IWICStream> stream;
    check_hresult(wic->CreateStream(stream.put()));
    check_hresult(stream->InitializeFromFilename(argv[2], GENERIC_WRITE));
    com_ptr<IWICBitmapEncoder> encoder;
    check_hresult(wic->CreateEncoder(GUID_ContainerFormatPng, nullptr, encoder.put()));
    check_hresult(encoder->Initialize(stream.get(), WICBitmapEncoderNoCache));
    com_ptr<IWICBitmapFrameEncode> out;
    check_hresult(encoder->CreateNewFrame(out.put(), nullptr));
    check_hresult(out->Initialize(nullptr));
    check_hresult(out->SetSize(desc.Width, desc.Height));
    WICPixelFormatGUID format = GUID_WICPixelFormat32bppBGRA;
    check_hresult(out->SetPixelFormat(&format));
    check_hresult(out->WritePixels(desc.Height, map.RowPitch, map.RowPitch * desc.Height, (BYTE*)map.pData));
    check_hresult(out->Commit());
    check_hresult(encoder->Commit());
    ctx->Unmap(staging.get(), 0);
    session.Close();
    pool.Close();
    wprintf(L"%s %ux%u\n", argv[2], desc.Width, desc.Height);
    return 0;
}

int wmain(int argc, wchar_t** argv) {
    try { return Capture(argc, argv); }
    catch (hresult_error const& e) { fwprintf(stderr, L"error 0x%08x %s\n", (unsigned)e.code(), e.message().c_str()); return 1; }
}
