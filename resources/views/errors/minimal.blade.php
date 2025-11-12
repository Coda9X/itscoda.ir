<!DOCTYPE html>
<html lang=en>

<head>
    <meta charset=utf-8>
    <meta name=viewport content=width=device-width,initial-scale=1,shrink-to-fit=yes>
    <title>@yield('code') @yield('title')</title>
    <meta name=robots content=noindex,nofollow>
    <meta name=description content="@yield('message')">
    <meta name=color-scheme content="light only" />
    {{-- @vite(['resources/css/errors.css', 'resources/ts/errors.ts']) --}}
    <link rel=stylesheet href={{ asset('assets/css/errors.css') }} type=text/css media=all crossorigin=anonymous referrerpolicy=no-referrer>
</head>

<body>
    <div aria-hidden=true>
        <div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
        <main>
            <header>
                <div><h1 error=@yield('code')>@yield('code')</h1></div>
                <h2><span class=hi>@yield('title')</span></h2>
            </header>
            <p><span class=hi>@yield('message')</span></p>
            <a href=/>Back To Home</a>
            <footer>
                <nav>
                    <a><i style="background: url({{asset('assets/svg/0xs4.svg')}})"></i></a>
                    <a><i style="background: url({{asset('assets/svg/0xs2.svg')}})"></i></a>
                    <a><i style="background: url({{asset('assets/svg/0xs1.svg')}})"></i></a>
                    <a><i style="background: url({{asset('assets/svg/0xs3.svg')}})"></i></a>
                </nav>
            </footer>
        </main>
    </div>
    <div id="progress-bar-container">
        <div id="progress-bar"></div>
      </div>      
    <script src={{ asset('assets/js/errors.js') }} defer type=text/javascript crossorigin=anonymous referrerpolicy=no-referrer></script>
</body>

</html>
