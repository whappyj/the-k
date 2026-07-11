import { useCallback } from 'react';
import type { Route } from '@/types';
import { ROUTE_EXPORT_LABEL } from '@/constants';
import { useAppData } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { captureElementAsJpg } from '@/lib/jpgExport';

function currentRoute(): Route {
  return (window.location.hash.replace('#', '') || 'home') as Route;
}

/** 지정한 라우트를 JPG로 저장한다. 현재 페이지가 아니면 먼저 이동한 뒤 캡처한다. */
export function useJpgExport() {
  const { data } = useAppData();
  const { showToast } = useToast();

  const exportPage = useCallback(
    (route: Route) => {
      const run = async () => {
        try {
          showToast('이미지 생성 중입니다...');
          await captureElementAsJpg(`page-${route}`, data.settings.jpgQuality, ROUTE_EXPORT_LABEL[route]);
          showToast('JPG로 저장했습니다.', 'success');
        } catch (err) {
          console.error(err);
          showToast('이미지 저장에 실패했습니다.', 'danger');
        }
      };

      if (currentRoute() !== route) {
        window.location.hash = `#${route}`;
        setTimeout(run, 200);
      } else {
        run();
      }
    },
    [data.settings.jpgQuality, showToast]
  );

  return { exportPage, exportCurrentPage: () => exportPage(currentRoute()) };
}
