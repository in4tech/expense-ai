import { Redirect } from 'expo-router';

import { href } from '@/src/navigation/href';

export default function Index() {
  return <Redirect href={href.authSignIn} />;
}
