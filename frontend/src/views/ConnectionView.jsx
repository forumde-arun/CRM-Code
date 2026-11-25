
'use client';

import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { Alert, Badge, PageHeader, Spinner } from '@/components/ui';

// ============================================
// FACEBOOK SDK CONFIGURATION
// ============================================

const FACEBOOK_SDK_URL =
  'https://connect.facebook.net/en_US/sdk.js';

const SDK_LOAD_TIMEOUT = 15000;
const SESSION_WAIT_TIMEOUT = 10000;

// Keep SDK initialization shared across component renders.
let sdkLoadPromise = null;
let initializedAppId = null;

// ============================================
// FETCH META CONFIGURATION FROM BACKEND
// ============================================

async function getMetaConfig() {
  const config = await api.get('/connection/config');

  // api.js returns the JSON object directly.
  if (!config || typeof config !== 'object') {
    throw new Error(
      'The backend returned an invalid Meta configuration response.'
    );
  }

  const appId = String(config.appId || '').trim();
  const configId = String(config.configId || '').trim();
  const version = String(config.version || 'v21.0').trim();

  if (!/^\d{10,20}$/.test(appId)) {
    throw new Error(
      'The backend returned an invalid Meta App ID. Please check META_APP_ID in Cloud Run.'
    );
  }

  if (!configId) {
    throw new Error(
      'Meta Embedded Signup Configuration ID is missing. Configure META_CONFIG_ID in the backend.'
    );
  }

  return {
    appId,
    configId,
    version,
  };
}

// ============================================
// LOAD AND INITIALIZE FACEBOOK SDK
// ============================================

function loadSdk(config) {
  if (!config?.appId) {
    return Promise.reject(
      new Error('A valid Meta App ID is required.')
    );
  }

  if (
    window.FB &&
    initializedAppId === config.appId
  ) {
    return Promise.resolve(window.FB);
  }

  if (sdkLoadPromise) {
    return sdkLoadPromise.then(() => {
      if (initializedAppId !== config.appId) {
        throw new Error(
          'Meta SDK is already initialized with a different App ID. Refresh the page and try again.'
        );
      }

      return window.FB;
    });
  }

  sdkLoadPromise = new Promise((resolve, reject) => {
    let settled = false;

    const timeout = window.setTimeout(() => {
      finish(
        new Error(
          'Meta SDK initialization timed out. Check your internet connection or browser extensions.'
        )
      );
    }, SDK_LOAD_TIMEOUT);

    const finish = (error) => {
      if (settled) return;

      settled = true;
      window.clearTimeout(timeout);

      if (error) {
        reject(error);
      } else {
        resolve(window.FB);
      }
    };

    const initialize = () => {
      if (!window.FB) {
        finish(
          new Error('Meta SDK failed to initialize.')
        );
        return;
      }

      try {
        window.FB.init({
          appId: config.appId,
          autoLogAppEvents: true,
          xfbml: true,
          version: config.version,
        });

        initializedAppId = config.appId;

        finish();
      } catch (error) {
        finish(error);
      }
    };

    // If SDK is already available, initialize it.
    if (window.FB) {
      initialize();
      return;
    }

    window.fbAsyncInit = initialize;

    let script = document.getElementById(
      'facebook-jssdk'
    );

    if (!script) {
      script = document.createElement('script');

      script.id = 'facebook-jssdk';
      script.src = FACEBOOK_SDK_URL;
      script.async = true;
      script.defer = true;

      script.onerror = () => {
        finish(
          new Error(
            'Unable to load Meta SDK. Check your internet connection or browser extensions.'
          )
        );
      };

      document.body.appendChild(script);
    } else {
      script.addEventListener(
        'error',
        () => {
          finish(
            new Error('Unable to load Meta SDK.')
          );
        },
        { once: true }
      );
    }
  });

  // Allow another attempt after an SDK loading failure.
  sdkLoadPromise = sdkLoadPromise.catch((error) => {
    sdkLoadPromise = null;
    initializedAppId = null;
    throw error;
  });

  return sdkLoadPromise;
}

// ============================================
// WAIT FOR EMBEDDED SIGNUP SESSION
// ============================================

function waitForSignupSession(getSession) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const check = () => {
      const session = getSession();

      if (session) {
        if (session.cancel) {
          reject(
            new Error('Meta Embedded Signup was cancelled.')
          );
          return;
        }

        if (session.error) {
          reject(
            new Error(
              session.error.message ||
                'Meta Embedded Signup returned an error.'
            )
          );
          return;
        }

        resolve(session);
        return;
      }

      if (Date.now() - startedAt >= SESSION_WAIT_TIMEOUT) {
        reject(
          new Error(
            'Meta did not return WhatsApp account information. Please start signup again.'
          )
        );
        return;
      }

      window.setTimeout(check, 100);
    };

    check();
  });
}

// ============================================
// EMBEDDED SIGNUP INSTRUCTIONS
// ============================================

const steps = [
  'Click Connect WhatsApp',
  'Sign in with Meta and choose your business account',
  'Enter and verify your phone number',
];

// ============================================
// CONNECTION VIEW
// ============================================

export default function ConnectionView() {
  const [st, setSt] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [m, setM] = useState({
    wabaId: '',
    phoneNumberId: '',
    token: '',
  });

  // ==========================================
  // LOAD CONNECTION STATUS
  // ==========================================

  const load = useCallback(async () => {
    try {
      const result = await api.get(
        '/connection/status'
      );

      setSt(result);
      return result;
    } catch (error) {
      setMsg(
        error.message ||
          'Unable to load connection status.'
      );

      return null;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ==========================================
  // META EMBEDDED SIGNUP
  // ==========================================

  const connect = async () => {
    if (busy) return;

    setMsg('');
    setBusy(true);

    let session = null;

    const onMsg = (event) => {
      try {
        const hostname = new URL(event.origin).hostname;

        // Only accept messages from Facebook domains.
        if (
          hostname !== 'facebook.com' &&
          !hostname.endsWith('.facebook.com')
        ) {
          return;
        }

        const data =
          typeof event.data === 'string'
            ? JSON.parse(event.data)
            : event.data;

        if (data?.type !== 'WA_EMBEDDED_SIGNUP') {
          return;
        }

        if (data.event === 'FINISH') {
          session = data.data;
        } else if (
          data.event === 'CANCEL' ||
          data.event === 'ERROR'
        ) {
          session = {
            cancel: true,
            error: data.data,
          };
        }
      } catch {
        // Ignore unrelated window messages.
      }
    };

    window.addEventListener('message', onMsg);

    try {
      // --------------------------------------
      // 1. Fetch configuration from backend
      // --------------------------------------

      const config = await getMetaConfig();

      // --------------------------------------
      // 2. Load Facebook SDK
      // --------------------------------------

      const FB = await loadSdk(config);

      // --------------------------------------
      // 3. Start Embedded Signup
      // --------------------------------------

      const response = await new Promise(
        (resolve) => {
          FB.login(resolve, {
            config_id: config.configId,
            response_type: 'code',
            override_default_response_type: true,
            extras: {
              setup: {},
              sessionInfoVersion: '3',
            },
          });
        }
      );

      // --------------------------------------
      // 4. Read authorization code
      // --------------------------------------

      const code = response?.authResponse?.code;

      if (!code) {
        throw new Error(
          'Signup was cancelled or Meta did not return an authorization code.'
        );
      }

      // --------------------------------------
      // 5. Wait for WhatsApp session details
      // --------------------------------------

      session = await waitForSignupSession(
        () => session
      );

      const wabaId = session.waba_id;
      const phoneNumberId =
        session.phone_number_id;

      if (!wabaId || !phoneNumberId) {
        throw new Error(
          'Meta did not return a valid WABA ID or Phone Number ID.'
        );
      }

      // --------------------------------------
      // 6. Send code and matching App ID
      // --------------------------------------

      const result = await api.post(
        '/connection/embedded',
        {
          code,
          wabaId,
          phoneNumberId,
          appId: config.appId,
        }
      );

      // --------------------------------------
      // 7. Show connection result
      // --------------------------------------

      if (result?.warnings?.length) {
        setMsg(
          'WhatsApp connected with warnings: ' +
            result.warnings.join(' ')
        );
      } else {
        setMsg(
          'WhatsApp connected successfully.'
        );
      }

      await load();
    } catch (error) {
      console.error(
        'WhatsApp Embedded Signup error:',
        error
      );

      setMsg(
        error.message ||
          'Unable to connect WhatsApp. Please try again.'
      );
    } finally {
      window.removeEventListener('message', onMsg);
      setBusy(false);
    }
  };

  // ==========================================
  // MANUAL SYSTEM USER CONNECTION
  // ==========================================

  const manual = async (event) => {
    event.preventDefault();

    if (busy) return;

    setMsg('');
    setBusy(true);

    try {
      await api.post('/connection/manual', m);

      setMsg(
        'WhatsApp connected successfully.'
      );

      setM({
        wabaId: '',
        phoneNumberId: '',
        token: '',
      });

      await load();
    } catch (error) {
      setMsg(
        error.message ||
          'Unable to save WhatsApp connection.'
      );
    } finally {
      setBusy(false);
    }
  };

  // ==========================================
  // DISCONNECT WHATSAPP
  // ==========================================

  const disconnect = async () => {
    if (busy) return;

    const confirmed = window.confirm(
      'Are you sure you want to disconnect your WhatsApp Business account?'
    );

    if (!confirmed) return;

    setBusy(true);
    setMsg('');

    try {
      await api.del('/connection');

      setMsg(
        'WhatsApp disconnected successfully.'
      );

      await load();
    } catch (error) {
      setMsg(
        error.message ||
          'Unable to disconnect WhatsApp.'
      );
    } finally {
      setBusy(false);
    }
  };

  // ==========================================
  // CONNECTION DETAILS
  // ==========================================

  const rows =
    st && st.status !== 'none'
      ? [
          ['Number', st.displayPhone || '-'],
          ['Business name', st.verifiedName || '-'],
          ['Quality rating', st.quality || '-'],
          ['WABA ID', st.wabaId || '-'],
        ]
      : [];

  // ==========================================
  // UI
  // ==========================================

  return (
    <>
      <PageHeader
        title="Connection"
        desc="Link your WhatsApp Business number once. Your connection is stored securely and reused for every campaign."
      />

      {msg && <Alert>{msg}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* CONNECT WHATSAPP */}

        <section
          className="card"
          aria-labelledby="connect-h"
        >
          <h2
            id="connect-h"
            className="text-lg font-semibold"
          >
            Connect WhatsApp
          </h2>

          <ol className="mt-3 space-y-2">
            {steps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 text-sm text-slate-600"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                  {index + 1}
                </span>

                {step}
              </li>
            ))}
          </ol>

          <button
            type="button"
            className="btn mt-5 w-full sm:w-auto"
            onClick={connect}
            disabled={busy}
          >
            {busy
              ? 'Connecting...'
              : 'Connect WhatsApp'}
          </button>

          {/* MANUAL CONNECTION */}

          <details className="mt-6 border-t border-slate-200 pt-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-800">
              Developer connect (System User token)
            </summary>

            <form
              onSubmit={manual}
              className="mt-4 space-y-3"
            >
              <input
                className="input"
                placeholder="WhatsApp Business Account ID"
                value={m.wabaId}
                onChange={(event) =>
                  setM({
                    ...m,
                    wabaId: event.target.value,
                  })
                }
                required
              />

              <input
                className="input"
                placeholder="Phone number ID"
                value={m.phoneNumberId}
                onChange={(event) =>
                  setM({
                    ...m,
                    phoneNumberId: event.target.value,
                  })
                }
                required
              />

              <input
                type="password"
                className="input"
                placeholder="System User access token"
                value={m.token}
                onChange={(event) =>
                  setM({
                    ...m,
                    token: event.target.value,
                  })
                }
                required
              />

              <button
                type="submit"
                className="btn-ghost"
                disabled={busy}
              >
                Save connection
              </button>
            </form>
          </details>
        </section>

        {/* CONNECTION STATUS */}

        <section
          className="card"
          aria-labelledby="status-h"
        >
          <h2
            id="status-h"
            className="text-lg font-semibold"
          >
            Connection status
          </h2>

          {!st ? (
            <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
              <Spinner />
              Checking...
            </div>
          ) : st.status === 'none' ? (
            <p className="mt-3 text-sm text-slate-500">
              No WhatsApp number connected yet.
            </p>
          ) : (
            <>
              <div className="mt-3">
                <Badge
                  kind={
                    st.connected ? 'ok' : 'bad'
                  }
                >
                  {st.connected
                    ? 'Connected'
                    : 'Needs reconnect'}
                </Badge>
              </div>

              <dl className="mt-4 divide-y divide-slate-100 text-sm">
                {rows.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between gap-4 py-2.5"
                  >
                    <dt className="text-slate-500">
                      {key}
                    </dt>

                    <dd className="break-all text-right font-medium text-slate-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={load}
                  disabled={busy}
                >
                  Refresh
                </button>

                <button
                  type="button"
                  className="btn-ghost"
                  onClick={disconnect}
                  disabled={busy}
                >
                  Disconnect
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
