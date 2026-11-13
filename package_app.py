import os
import sys
import zipfile
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
APP = ROOT / "APP"
APP.mkdir(exist_ok=True)

print("Starting package generator...")

# 1. Create Web ZIP for Render / APK converters inside APP/ and root
zip_app_path = APP / "NTTF_M3B_Birthdays_App.zip"
zip_render_path = ROOT / "NTTF_M3B_Birthdays_Render.zip"

def create_zip_from_dir(source_dir, output_zip):
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                file_path = Path(root) / file
                arcname = file_path.relative_to(source_dir)
                zf.write(file_path, arcname)
    print(f"Created ZIP: {output_zip} ({os.path.getsize(output_zip)} bytes)")

create_zip_from_dir(DIST, zip_app_path)
create_zip_from_dir(DIST, zip_render_path)

# 2. Build Android Studio Native Project structure in APP/android-project
android_dir = APP / "android-project"
app_module = android_dir / "app"
src_main = app_module / "src" / "main"
java_pkg = src_main / "java" / "com" / "nttf" / "m3b" / "birthday"
res_drawable = src_main / "res" / "drawable"
res_mipmap = src_main / "res" / "mipmap"
res_values = src_main / "res" / "values"
res_layout = src_main / "res" / "layout"
assets_dir = src_main / "assets"

for d in [java_pkg, res_drawable, res_mipmap, res_values, res_layout, assets_dir]:
    d.mkdir(parents=True, exist_ok=True)

# Copy dist contents into assets/
for item in DIST.iterdir():
    dest = assets_dir / item.name
    if item.is_dir():
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(item, dest)
    else:
        shutil.copy2(item, dest)

print("Copied web assets into Android project assets/")

# Copy app logo as ic_launcher and splash as splash_graphic
if (APP / "app_logo.jpg").exists():
    shutil.copy2(APP / "app_logo.jpg", res_mipmap / "ic_launcher.jpg")
    shutil.copy2(APP / "app_logo.jpg", res_drawable / "ic_launcher.jpg")
if (APP / "app_splash.jpg").exists():
    shutil.copy2(APP / "app_splash.jpg", res_drawable / "splash_graphic.jpg")

# Write AndroidManifest.xml
manifest_content = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.nttf.m3b.birthday"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="NTTF M3B Birthdays"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.Design.NoActionBar"
        android:usesCleartextTraffic="true">

        <!-- Splash Activity -->
        <activity
            android:name=".SplashActivity"
            android:theme="@style/Theme.SplashScreen"
            android:screenOrientation="portrait"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Main WebView Activity -->
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:screenOrientation="portrait"
            android:exported="false" />
    </application>
</manifest>
"""
(src_main / "AndroidManifest.xml").write_text(manifest_content, encoding="utf-8")

# Write SplashActivity.java
splash_activity_java = """package com.nttf.m3b.birthday;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ImageView;

public class SplashActivity extends Activity {
    private static final int SPLASH_DURATION_MS = 2000;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        setContentView(R.layout.activity_splash);

        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                startActivity(intent);
                finish();
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            }
        }, SPLASH_DURATION_MS);
    }
}
"""
(java_pkg / "SplashActivity.java").write_text(splash_activity_java, encoding="utf-8")

# Write MainActivity.java (WebView loading offline assets with hardware acceleration)
main_activity_java = """package com.nttf.m3b.birthday;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Load offline bundled celebration system
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
"""
(java_pkg / "MainActivity.java").write_text(main_activity_java, encoding="utf-8")

# Write layout files
activity_splash_xml = """<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#050813">

    <ImageView
        android:id="@+id/splash_image"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:scaleType="fitCenter"
        android:src="@drawable/splash_graphic"
        android:contentDescription="NTTF M3B Splash" />
</RelativeLayout>
"""
(res_layout / "activity_splash.xml").write_text(activity_splash_xml, encoding="utf-8")

activity_main_xml = """<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#050813">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</FrameLayout>
"""
(res_layout / "activity_main.xml").write_text(activity_main_xml, encoding="utf-8")

# Write styles.xml
styles_xml = """<resources>
    <style name="Theme.SplashScreen" parent="android:Theme.NoTitleBar.Fullscreen">
        <item name="android:windowBackground">#050813</item>
    </style>
    <style name="Theme.Design.NoActionBar" parent="android:Theme.NoTitleBar">
        <item name="android:windowBackground">#050813</item>
    </style>
</resources>
"""
(res_values / "styles.xml").write_text(styles_xml, encoding="utf-8")

# Write build.gradle files
root_build_gradle = """buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
"""
(android_dir / "build.gradle").write_text(root_build_gradle, encoding="utf-8")

settings_gradle = """rootProject.name = "NTTF_M3B_Birthdays"
include ':app'
"""
(android_dir / "settings.gradle").write_text(settings_gradle, encoding="utf-8")

app_build_gradle = """plugins {
    id 'com.android.application'
}

android {
    namespace 'com.nttf.m3b.birthday'
    compileSdk 34

    defaultConfig {
        applicationId "com.nttf.m3b.birthday"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
"""
(app_module / "build.gradle").write_text(app_build_gradle, encoding="utf-8")

# Create zip of the entire Android Studio project as well
create_zip_from_dir(android_dir, APP / "NTTF_M3B_AndroidStudio_Project.zip")

print("Android Studio project and web bundles generated successfully in APP/!")
