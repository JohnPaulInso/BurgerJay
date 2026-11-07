package com.burgerjay.pos;

import com.getcapacitor.BridgeActivity;

// (2026-07-13) Rebrand Android package to com.burgerjay.pos; was com.route98.pos
public class MainActivity extends BridgeActivity {
    @Override
    public void onResume() {
        super.onResume();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
        }
    }
}

