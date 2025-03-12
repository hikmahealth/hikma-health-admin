/* eslint-env node, browser */
import type { TwindConfig, TwindUserConfig } from '@twind/core';
import type { AppProps } from 'next/app';
import type { ComponentType } from 'react';

import { install as install$ } from '@twind/core';
import { createElement } from 'react';

export default install;

function install(config: TwindConfig | TwindUserConfig): React.JSXElementConstructor;

function install<Props, Component>(
  config: TwindConfig | TwindUserConfig,
  AppComponent: React.JSXElementConstructor & Component,
  isProduction?: boolean
): Component;

function install<Props, Component>(
  config: TwindConfig | TwindUserConfig,
  AppComponent: React.JSXElementConstructor & Component = TwindApp as any,
  isProduction = process.env.NODE_ENV == 'production'
): Component {
  install$(config as TwindUserConfig, isProduction);

  return AppComponent;
}

function TwindApp(props: AppProps) {
  return createElement(props.Component as ComponentType, props.pageProps);
}
