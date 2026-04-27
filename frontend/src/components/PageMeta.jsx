import { Helmet } from 'react-helmet-async'

function PageMeta({
  title,
  description,
  keywords,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogType = 'website',
  ogUrl,
  ogImage,
  structuredData,
}) {
  const schemaBlocks = Array.isArray(structuredData)
    ? structuredData
    : structuredData
      ? [structuredData]
      : []

  return (
    <Helmet>
      <title>{title}</title>
      <meta content={description} name="description" />
      {keywords ? <meta content={keywords} name="keywords" /> : null}
      {canonicalUrl ? <link href={canonicalUrl} rel="canonical" /> : null}
      <meta content={ogTitle || title} property="og:title" />
      <meta content={ogDescription || description} property="og:description" />
      <meta content={ogType} property="og:type" />
      {ogUrl ? <meta content={ogUrl} property="og:url" /> : null}
      {ogImage ? <meta content={ogImage} property="og:image" /> : null}
      {schemaBlocks.map((schema, index) => (
        <script key={`structured-data-${index}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  )
}

export default PageMeta
