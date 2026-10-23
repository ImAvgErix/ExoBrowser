// winrec <window class | #handle> <out-prefix> <milliseconds> [x y w h]: every frame Windows composes for a window
// during that time (Windows.Graphics.Capture hands over a frame only when something on it changed), cropped to the
// given client rectangle, as <out-prefix>-NNN-<ms>.png. For checking a transition frame by frame (a menu opening,
// glass coming in) where one screenshot can't show what happens between. It ends by printing when it started, in Unix
// milliseconds, so a frame's time can be lined up with a page's own clock (performance.timeOrigin + performance.now()).
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
#include <mutex>
#include <string>
#include <vector>

using namespace winrt;
using namespace winrt::Windows::Graphics::Capture;
using namespace winrt::Windows::Graphics::DirectX;

struct Shot { long long ms; UINT w, h; std::vector<BYTE> pixels; };

static int Record(int argc, wchar_t** argv) {
    if (argc < 4) { fwprintf(stderr, L"usage: winrec <class|#hwnd> <out-prefix> <ms> [x y w h]\n"); return 2; }
    init_apartment(apartment_type::multi_threaded);
    HWND hwnd = argv[1][0] == L'#' ? (HWND)(INT_PTR)_wtoi64(argv[1] + 1) : FindWindowW(argv[1], nullptr);
    if (!hwnd || IsIconic(hwnd)) { fwprintf(stderr, L"window not found or minimized\n"); return 1; }
    int duration = _wtoi(argv[3]);
    int cx = argc > 7 ? _wtoi(argv[4]) : 0, cy = argc > 7 ? _wtoi(argv[5]) : 0;
    int cw = argc > 7 ? _wtoi(argv[6]) : 0, ch = argc > 7 ? _wtoi(argv[7]) : 0;

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
    auto size = item.Size();
    if (!cw || !ch) { cx = cy = 0; cw = size.Width; ch = size.Height; }
    cw = std::min(cw, size.Width - cx);
    ch = std::min(ch, size.Height - cy);
    auto pool = Direct3D11CaptureFramePool::CreateFreeThreaded(device, DirectXPixelFormat::B8G8R8A8UIntNormalized, 3, size);
    auto session = pool.CreateCaptureSession(item);
    session.IsCursorCaptureEnabled(false);
    try { session.IsBorderRequired(false); } catch (...) {}
    // Every frame the screen shows, not Windows' default of at most 60 a second (Windows 11 24H2 and later).
    try { session.MinUpdateInterval(std::chrono::milliseconds(1)); } catch (...) {}

    D3D11_TEXTURE2D_DESC desc{};
    desc.Width = cw;
    desc.Height = ch;
    desc.MipLevels = 1;
    desc.ArraySize = 1;
    desc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    desc.SampleDesc.Count = 1;
    desc.Usage = D3D11_USAGE_STAGING;
    desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
    com_ptr<ID3D11Texture2D> staging;
    check_hresult(d3d->CreateTexture2D(&desc, nullptr, staging.put()));

    std::mutex lock;
    std::vector<Shot> shots;
    LARGE_INTEGER freq, start;
    QueryPerformanceFrequency(&freq);
    QueryPerformanceCounter(&start);
    FILETIME startedAt;
    GetSystemTimePreciseAsFileTime(&startedAt);
    pool.FrameArrived([&](Direct3D11CaptureFramePool const& p, auto&&) {
        auto f = p.TryGetNextFrame();
        if (!f || shots.size() >= 400) return;
        LARGE_INTEGER now;
        QueryPerformanceCounter(&now);
        com_ptr<ID3D11Texture2D> tex;
        auto access = f.Surface().as<::Windows::Graphics::DirectX::Direct3D11::IDirect3DDxgiInterfaceAccess>();
        check_hresult(access->GetInterface(IID_PPV_ARGS(tex.put())));
        std::lock_guard<std::mutex> hold(lock);
        D3D11_BOX box{(UINT)cx, (UINT)cy, 0, (UINT)(cx + cw), (UINT)(cy + ch), 1};
        ctx->CopySubresourceRegion(staging.get(), 0, 0, 0, 0, tex.get(), 0, &box);
        D3D11_MAPPED_SUBRESOURCE map;
        if (FAILED(ctx->Map(staging.get(), 0, D3D11_MAP_READ, 0, &map))) return;
        Shot shot{(now.QuadPart - start.QuadPart) * 1000 / freq.QuadPart, (UINT)cw, (UINT)ch, std::vector<BYTE>((size_t)cw * ch * 4)};
        for (int y = 0; y < ch; y++) {
            memcpy(shot.pixels.data() + (size_t)y * cw * 4, (BYTE*)map.pData + (size_t)y * map.RowPitch, (size_t)cw * 4);
            for (int x = 0; x < cw; x++) shot.pixels[((size_t)y * cw + x) * 4 + 3] = 255;
        }
        ctx->Unmap(staging.get(), 0);
        shots.push_back(std::move(shot));
    });
    session.StartCapture();
    Sleep(duration);
    session.Close();
    pool.Close();

    com_ptr<IWICImagingFactory> wic;
    check_hresult(CoCreateInstance(CLSID_WICImagingFactory, nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(wic.put())));
    std::lock_guard<std::mutex> hold(lock);
    for (size_t i = 0; i < shots.size(); i++) {
        auto& s = shots[i];
        wchar_t name[MAX_PATH];
        swprintf_s(name, L"%s-%03zu-%05lld.png", argv[2], i, s.ms);
        com_ptr<IWICStream> stream;
        check_hresult(wic->CreateStream(stream.put()));
        check_hresult(stream->InitializeFromFilename(name, GENERIC_WRITE));
        com_ptr<IWICBitmapEncoder> encoder;
        check_hresult(wic->CreateEncoder(GUID_ContainerFormatPng, nullptr, encoder.put()));
        check_hresult(encoder->Initialize(stream.get(), WICBitmapEncoderNoCache));
        com_ptr<IWICBitmapFrameEncode> out;
        check_hresult(encoder->CreateNewFrame(out.put(), nullptr));
        check_hresult(out->Initialize(nullptr));
        check_hresult(out->SetSize(s.w, s.h));
        WICPixelFormatGUID format = GUID_WICPixelFormat32bppBGRA;
        check_hresult(out->SetPixelFormat(&format));
        check_hresult(out->WritePixels(s.h, s.w * 4, (UINT)s.pixels.size(), s.pixels.data()));
        check_hresult(out->Commit());
        check_hresult(encoder->Commit());
    }
    ULARGE_INTEGER t{startedAt.dwLowDateTime, startedAt.dwHighDateTime};
    wprintf(L"%zu frames in %d ms, started at %.1f\n", shots.size(), duration, (double)(t.QuadPart - 116444736000000000ULL) / 10000.0);
    return 0;
}

int wmain(int argc, wchar_t** argv) {
    try { return Record(argc, argv); }
    catch (hresult_error const& e) { fwprintf(stderr, L"error 0x%08x %s\n", (unsigned)e.code(), e.message().c_str()); return 1; }
}
