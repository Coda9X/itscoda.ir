<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'portfolio.me', ['items' => config('socials')]);
Route::view('/{page}', 'portfolio.me', ['items' => config('socials')])->whereIn('page', ['me', 'dev']);