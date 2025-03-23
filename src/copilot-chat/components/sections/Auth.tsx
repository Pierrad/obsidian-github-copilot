import React from 'react';
import { Notice } from 'obsidian';
import { getDeviceCode, getPAT, getToken } from '../../api';
import { concat, cx } from "../../../utils/style";
import { copilotIcon } from '../../../assets/copilot';
import { usePlugin } from '../../hooks/usePlugin';
import { useAuthStore } from '../../store/store';

const BASE_CLASSNAME = "copilot-chat-auth";

const Auth: React.FC = () => {
  const plugin = usePlugin();
  const setDeviceCode = useAuthStore((state) => state.setDeviceCode);
  const setPAT = useAuthStore((state) => state.setPAT);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  const handleTokenSuccess = (data: any) => {
    console.log("Token data", data);
    if (data && plugin) {
      setAccessToken(plugin, {
        token: data.token,
        expiresAt: data.expires_at,
      });
    }
  };

  const { mutate: tokenMutation, data: tokenData } = getToken(handleTokenSuccess)

  const handleDeviceCodeSuccess = (data: any) => {
    console.log("Device code data", data);
    if (data && plugin) {
      setDeviceCode(plugin, data.device_code);
    }
  };

  const handlePATSuccess = (data: any) => {
    console.log("PAT data", data);
    if (data && plugin) {
      setPAT(plugin, data.access_token);
      tokenMutation(data.access_token);
    }
  };

  const { mutate: deviceCodeMutation, data: deviceCodeData } = getDeviceCode(handleDeviceCodeSuccess);
  const { mutate: patMutation } = getPAT(handlePATSuccess);
  
  const handleRequestCode = () => {
    deviceCodeMutation();
  }

  const handleCopyCode = () => {
    if (deviceCodeData) {
      navigator.clipboard.writeText(deviceCodeData.user_code);
      new Notice("Code copied to clipboard");
    } else {
      new Notice("No device code data available");
    }
  }

  const handleValidateAuth = () => {
    if (deviceCodeData) {
      patMutation(deviceCodeData.device_code);
    } else {
      new Notice("No device code data available");
    }
  }

  return (
    <div className={cx(concat(BASE_CLASSNAME, "container"))}>
      <div
        dangerouslySetInnerHTML={{ __html: copilotIcon }}
        className={cx(concat(BASE_CLASSNAME, "icon"), "copilot-big-icon")}
      />
      {!tokenData && (
        <>
          <h1 className={cx(concat(BASE_CLASSNAME, "title"), "copilot-chat-title")}>Authentication</h1>
          <p className={cx(concat(BASE_CLASSNAME, "text"), "copilot-chat-subtitle")}>
            Please log in to access copilot chat features.
          </p>
          {!deviceCodeData && (
            <button onClick={handleRequestCode} className={cx(concat(BASE_CLASSNAME, "button"), "mod-cta")}>
              Request code
            </button>
          )}
          {deviceCodeData && (
            <div className={cx(concat(BASE_CLASSNAME, "code"))}>
              <a href={deviceCodeData.verification_uri} target="_blank" rel="noopener noreferrer">
                You can click here to open the verification page
              </a>
              <p className={cx(concat(BASE_CLASSNAME, "code-text"))}>
                Your code: {deviceCodeData.user_code}
              </p>
              <div className={cx(concat(BASE_CLASSNAME, "code-actions"))}>
                <button onClick={handleCopyCode}>
                  Copy code
                </button>
                <button onClick={handleRequestCode}>
                  Request new code
                </button>
                <button onClick={handleValidateAuth} className="mod-cta">
                  Click here once you have logged in on the verification page
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Auth;