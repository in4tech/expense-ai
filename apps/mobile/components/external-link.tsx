import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  async function handlePress(event: Parameters<NonNullable<ComponentProps<typeof Link>['onPress']>>[0]) {
    if (process.env.EXPO_OS !== 'web') {
      event.preventDefault();
      await openBrowserAsync(href, {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
    }
  }

  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={handlePress}
    />
  );
}
