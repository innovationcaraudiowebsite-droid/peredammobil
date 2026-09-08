'use client'

import Script from 'next/script'

/**
 * Google Analytics 4 + optional Google Tag Manager.
 *
 * IDs come from SiteSetting (DB), passed from the server layout.
 *
 * - GA4: gtag.js script injected with strategy "afterInteractive".
 * - GTM: if gtmId provided, the GTM script is injected first.
 *
 * Both fire automatic page_view events on route changes (GA4 default).
 */
export function Analytics({
  gaMeasurementId,
  gtmId,
}: {
  gaMeasurementId?: string | null
  gtmId?: string | null
}) {
  if (!gaMeasurementId && !gtmId) return null

  return (
    <>
      {gtmId && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        </>
      )}

      {gaMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
            id="ga4-lib"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}', { anonymize_ip: true });`,
            }}
          />
        </>
      )}
    </>
  )
}
