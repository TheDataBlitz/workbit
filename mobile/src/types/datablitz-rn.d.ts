/**
 * RN entry components use `onPress` / `ViewStyle`; published .d.ts skew web.
 * Ambient declarations keep `tsc` aligned with runtime (Design Bit MCP / native builds).
 */
import type { ReactNode } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';

declare module '@thedatablitz/button' {
  export function Button(props: {
    variant?:
      | 'primary'
      | 'warning'
      | 'success'
      | 'danger'
      | 'info'
      | 'glass'
      | 'ai';
    buttonType?: 'default' | 'icon' | 'link' | 'icon-link' | 'split';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    onPress?: () => void;
    children?: ReactNode;
    style?: ViewStyle;
    icon?: ReactNode;
    accessibilityLabel?: string;
    selected?: boolean;
    splitLabel?: ReactNode;
    onSplitAction?: () => void;
  }): ReactNode;
}

declare module '@thedatablitz/box' {
  type Space =
    | '0'
    | '025'
    | '050'
    | '100'
    | '150'
    | '200'
    | '300'
    | '400'
    | '600';
  export function Box(props: {
    children?: ReactNode;
    padding?: Space;
    margin?: Space;
    border?: boolean;
    fullWidth?: boolean;
    inline?: boolean;
    align?: ViewStyle['alignItems'];
    justify?: ViewStyle['justifyContent'];
    style?: ViewStyle;
  }): ReactNode;
}

declare module '@thedatablitz/stack' {
  type Space =
    | '0'
    | '025'
    | '050'
    | '100'
    | '150'
    | '200'
    | '300'
    | '400'
    | '600';
  export function Stack(props: {
    children?: ReactNode;
    gap?: Space;
    padding?: Space;
    align?: ViewStyle['alignItems'];
    justify?: ViewStyle['justifyContent'];
    fullWidth?: boolean;
    style?: ViewStyle;
  }): ReactNode;
}

declare module '@thedatablitz/inline' {
  type Space =
    | '0'
    | '025'
    | '050'
    | '100'
    | '150'
    | '200'
    | '300'
    | '400'
    | '600';
  export function Inline(props: {
    children?: ReactNode;
    gap?: Space;
    padding?: Space;
    align?: ViewStyle['alignItems'] | 'start' | 'end';
    justify?:
      | ViewStyle['justifyContent']
      | 'between'
      | 'around'
      | 'evenly'
      | 'start'
      | 'end';
    wrap?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
  }): ReactNode;
}

declare module '@thedatablitz/text' {
  export function Text(props: {
    children?: ReactNode;
    variant?:
      | 'heading1'
      | 'heading2'
      | 'heading3'
      | 'heading4'
      | 'heading5'
      | 'heading6'
      | 'heading7'
      | 'body1'
      | 'body2'
      | 'body3'
      | 'body4'
      | 'caption1'
      | 'caption2'
      | 'ai';
    color?: string;
    truncate?: boolean;
    paragraphSpacing?: boolean;
    style?: TextStyle;
  }): ReactNode;
}

declare module '@thedatablitz/avatar' {
  export function Avatar(props: {
    name?: string;
    src?: string;
    size?: 'small' | 'medium' | 'large' | 'xlarge';
    variant?: 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'ai';
    style?: ViewStyle;
  }): ReactNode;
}

declare module '@thedatablitz/card' {
  export function Card(props: {
    children?: ReactNode;
    size?: 'small' | 'medium' | 'large';
    variant?:
      | 'default'
      | 'brand'
      | 'success'
      | 'warning'
      | 'danger'
      | 'info'
      | 'ai';
    type?: 'bordered' | 'solid';
    loading?: boolean;
    error?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
  }): ReactNode;
  export function CardHeader(props: {
    children?: ReactNode;
    divider?: boolean;
    style?: ViewStyle;
  }): ReactNode;
  export function CardContent(props: {
    children?: ReactNode;
    divider?: boolean;
    style?: ViewStyle;
  }): ReactNode;
  export function CardFooter(props: {
    children?: ReactNode;
    divider?: boolean;
    style?: ViewStyle;
  }): ReactNode;
}
