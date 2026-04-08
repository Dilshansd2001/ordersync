import PageMeta from '@/components/PageMeta'
import SplashStatusCard from '@/components/desktop-shell/SplashStatusCard'

function BootstrapShell({ metadata }) {
  return (
    <>
      <PageMeta title="Checking Workspace - OrderSync.lk" description="Preparing the OrderSync.lk desktop workspace." />
      <SplashStatusCard
        description="Checking your session, device identity, tenant access, and subscription status before the workspace opens."
        metadata={metadata}
        title="Checking your workspace..."
      />
    </>
  )
}

export default BootstrapShell
