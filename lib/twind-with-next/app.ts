/* eslint-env node, browser */
import type { BaseTheme, TwindConfig, TwindUserConfig } from '@twind/core';
import type { AppProps } from 'next/app';
import type { ComponentType } from 'react';

import { install as install$ } from '@twind/core';
import { createElement } from 'react';

export default install;

function install<Theme extends BaseTheme = BaseTheme>(config: TwindConfig<Theme> | TwindUserConfig<Theme>): React.JSXElementConstructor<unknown>;

function install<Props, Component, Theme extends BaseTheme = BaseTheme>(
  config: TwindConfig<Theme> | TwindUserConfig<Theme>,
  AppComponent: React.JSXElementConstructor<Props> & Component,
  isProduction?: boolean
): Component;

function install<Props, Component, Theme extends BaseTheme = BaseTheme>(
  config: TwindConfig<Theme> | TwindUserConfig<Theme>,
  AppComponent: React.JSXElementConstructor<Props> & Component = TwindApp as any,
  isProduction = process.env.NODE_ENV == 'production'
): Component {
  install$(config as TwindUserConfig, isProduction);

  return AppComponent;
}

function TwindApp(props: AppProps) {
  return createElement(props.Component as ComponentType, props.pageProps);
}
