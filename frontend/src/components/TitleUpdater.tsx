import { useEffect } from 'react';
import { publicApi } from '../lib/api';

export default function TitleUpdater() {
  useEffect(() => {
    publicApi.getConfig().then((c: any) => {
      if (c.business_name) {
        document.title = document.title.replace(/Nebulosa?Hair/g, c.business_name);
      }
    }).catch(() => {});
  }, []);
  return null;
}
