import React from "react";
import {
  GITHUB_SIGNUP_SETUP_DOC,
  GOOGLE_SIGNUP_SETUP_DOC,
  SIGNUP_RESTRICTION_DOC,
} from "constants/ThirdPartyConstants";
import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingSubCategories,
  SettingSubtype,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import type { AuthMethodType } from "./AuthPage";
import { AuthPage } from "./AuthPage";
import Google from "assets/images/Google.png";
import SamlSso from "assets/images/saml.svg";
import OIDC from "assets/images/oidc.svg";
import Github from "assets/images/Github.png";
import Lock from "assets/images/lock-password-line.svg";
import { getAppsmithConfigs } from "@appsmith/configs";
import {
  JS_ORIGIN_URI_FORM,
  REDIRECT_URL_FORM,
} from "@appsmith/constants/forms";

const { disableLoginForm, enableGithubOAuth, enableGoogleOAuth } =
  getAppsmithConfigs();

const FormAuth: AdminConfigType = {
  type: SettingCategories.FORM_AUTH,
  controlType: SettingTypes.GROUP,
  title: "Form login",
  subText: "Enable your workspace to sign in with Appsmith form.",
  canSave: true,
  isConnected: false,
  settings: [
    {
      id: "APPSMITH_FORM_LOGIN_DISABLED",
      category: SettingCategories.FORM_AUTH,
      subCategory: SettingSubCategories.FORMLOGIN,
      controlType: SettingTypes.TOGGLE,
      label: "Form login",
      toggleText: (value: boolean) =>
        value ? "Enable form login" : "Form login enabled",
    },
    {
      id: "APPSMITH_SIGNUP_DISABLED",
      category: SettingCategories.FORM_AUTH,
      subCategory: SettingSubCategories.FORMLOGIN,
      controlType: SettingTypes.TOGGLE,
      label: "Form signup",
      toggleText: (value: boolean) =>
        value
          ? "Allow all users to signup"
          : "Allow only invited users to signup",
    },
    {
      id: "APPSMITH_FORM_CALLOUT_BANNER",
      category: SettingCategories.FORM_AUTH,
      subCategory: SettingSubCategories.FORMLOGIN,
      controlType: SettingTypes.LINK,
      label:
        "The form login method does not verify the emails of users that create accounts.",
      url: SIGNUP_RESTRICTION_DOC,
      calloutType: "Warning",
    },
  ],
};

const GoogleAuth: AdminConfigType = {
  type: SettingCategories.GOOGLE_AUTH,
  controlType: SettingTypes.GROUP,
  title: "Google authentication",
  subText: "Enable your workspace to sign in with Google (OAuth).",
  canSave: true,
  isConnected: enableGoogleOAuth,
  settings: [
    {
      id: "APPSMITH_OAUTH2_GOOGLE_READ_MORE",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: SettingSubCategories.GOOGLE,
      controlType: SettingTypes.LINK,
      label: "How to configure?",
      url: GOOGLE_SIGNUP_SETUP_DOC,
    },
    {
      id: "APPSMITH_OAUTH2_GOOGLE_JS_ORIGIN_URL",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: SettingSubCategories.GOOGLE,
      controlType: SettingTypes.UNEDITABLEFIELD,
      label: "JavaScript origin URL",
      formName: JS_ORIGIN_URI_FORM,
      fieldName: "js-origin-url-form",
      value: "",
      tooltip:
        "This URL will be used while configuring the Google OAuth Client ID's authorized JavaScript origins",
      helpText: "Paste this URL in your Google developer console.",
    },
    {
      id: "APPSMITH_OAUTH2_GOOGLE_REDIRECT_URL",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: SettingSubCategories.GOOGLE,
      controlType: SettingTypes.UNEDITABLEFIELD,
      label: "Redirect URL",
      formName: REDIRECT_URL_FORM,
      fieldName: "redirect-url-form",
      value: "/login/oauth2/code/google",
      tooltip:
        "This URL will be used while configuring the Google OAuth Client ID's authorized Redirect URIs",
      helpText: "Paste this URL in your Google developer console.",
    },
    {
      id: "APPSMITH_OAUTH2_GOOGLE_CLIENT_ID",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: SettingSubCategories.GOOGLE,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client ID",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: SettingSubCategories.GOOGLE,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client secret",
      isRequired: true,
    },
    {
      id: "APPSMITH_SIGNUP_ALLOWED_DOMAINS",
      category: SettingCategories.GOOGLE_AUTH,
      subCategory: SettingSubCategories.GOOGLE,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Allowed domains",
      placeholder: "domain1.com, domain2.com",
    },
  ],
};

const GithubAuth: AdminConfigType = {
  type: SettingCategories.GITHUB_AUTH,
  controlType: SettingTypes.GROUP,
  title: "Github authentication",
  subText:
    "Enable your workspace to sign in with Github SAML single sign-on (SSO).",
  canSave: true,
  isConnected: enableGithubOAuth,
  settings: [
    {
      id: "APPSMITH_OAUTH2_GITHUB_READ_MORE",
      category: SettingCategories.GITHUB_AUTH,
      subCategory: SettingSubCategories.GITHUB,
      controlType: SettingTypes.LINK,
      label: "How to configure?",
      url: GITHUB_SIGNUP_SETUP_DOC,
    },
    {
      id: "APPSMITH_OAUTH2_GITHUB_CLIENT_ID",
      category: SettingCategories.GITHUB_AUTH,
      subCategory: SettingSubCategories.GITHUB,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client ID",
      isRequired: true,
    },
    {
      id: "APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET",
      category: SettingCategories.GITHUB_AUTH,
      subCategory: SettingSubCategories.GITHUB,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Client secret",
      isRequired: true,
    },
  ],
};

export const FormAuthCallout: AuthMethodType = {
  id: "APPSMITH_FORM_LOGIN_AUTH",
  category: SettingCategories.FORM_AUTH,
  label: "Form login",
  subText: "Enable your workspace to sign in with Appsmith Form.",
  image: Lock,
  icon: "lock-password-line",
  isConnected: !disableLoginForm,
};

export const GoogleAuthCallout: AuthMethodType = {
  id: "APPSMITH_GOOGLE_AUTH",
  category: SettingCategories.GOOGLE_AUTH,
  label: "Google",
  subText:
    "Enable your workspace to sign in with Google (OAuth 2.0) single sign-on (SSO).",
  image: Google,
  isConnected: enableGoogleOAuth,
};

export const GithubAuthCallout: AuthMethodType = {
  id: "APPSMITH_GITHUB_AUTH",
  category: SettingCategories.GITHUB_AUTH,
  label: "Github",
  subText:
    "Enable your workspace to sign in with Github (OAuth 2.0) single sign-on (SSO).",
  image: Github,
  isConnected: enableGithubOAuth,
};

export const SamlAuthCallout: AuthMethodType = {
  id: "APPSMITH_SAML_AUTH",
  category: "saml",
  label: "SAML 2.0",
  subText: `Enable your workspace to sign in with your preferred SAML2 compliant provider.`,
  image: SamlSso,
  needsUpgrade: true,
};

export const OidcAuthCallout: AuthMethodType = {
  id: "APPSMITH_OIDC_AUTH",
  category: "oidc",
  label: "OIDC",
  subText: `Enable your workspace to sign in with your preferred OIDC compliant provider.`,
  image: OIDC,
  needsUpgrade: true,
};

const AuthMethods = [
  OidcAuthCallout,
  SamlAuthCallout,
  GoogleAuthCallout,
  GithubAuthCallout,
  FormAuthCallout,
];

function AuthMain() {
  return <AuthPage authMethods={AuthMethods} />;
}

export const config: AdminConfigType = {
  icon: "lock-password-line",
  type: SettingCategories.AUTHENTICATION,
  controlType: SettingTypes.PAGE,
  title: "Authentication",
  canSave: false,
  children: [FormAuth, GoogleAuth, GithubAuth],
  component: AuthMain,
};
