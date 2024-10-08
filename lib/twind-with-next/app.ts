/* eslint-env node, browser */
import type { ComponentType } from 'react';
import type { AppProps } from 'next/app';
import type { TwindConfig, TwindUserConfig } from '@twind/core';

import { createElement } from 'react';
import { install as install$ } from '@twind/core';

export default install;

function install(
  config: TwindConfig<any> | TwindUserConfig<any>
): React.JSXElementConstructor<AppProps>;

function install<Props, Component>(
  config: TwindConfig<any> | TwindUserConfig<any>,
  AppComponent: React.JSXElementConstructor<Props> & Component,
  isProduction?: boolean
): Component;

function install<Props, Component>(
  config: TwindConfig | TwindUserConfig,
  AppComponent: React.JSXElementConstructor<Props> & Component = TwindApp as any,
  isProduction = process.env.NODE_ENV == 'production'
): Component {
  install$(config as TwindUserConfig, isProduction);

  return AppComponent;
}

function TwindApp(props: AppProps) {
  return createElement(props.Component as ComponentType<any>, props.pageProps);
}
