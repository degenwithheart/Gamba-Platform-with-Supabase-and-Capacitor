import React from 'react'
import { Modal } from '../../components/Modal'
import { ModalContent, HeaderSection, Title, Subtitle, Section, Row, List, Item } from './AdminModal.styles'
import { GambaUi } from 'gamba-react-ui-v2'

interface AdminModalProps {
  open: boolean
  onClose: () => void
  content: any
}

const AdminModal: React.FC<AdminModalProps> = ({ open, onClose, content }) => {
  if (!open) return null

  return (
    <Modal onClose={onClose}>
      <ModalContent>
        <HeaderSection>
          <Title>Admin Console</Title>
          <Subtitle>Management and diagnostics for platform operators</Subtitle>
        </HeaderSection>

        {content?.type === 'users' && (
          <Section>
            <Row>
              <div style={{ fontWeight: 600 }}>Users</div>
            </Row>
            <List>
              {(content.payload?.body?.data?.users ?? []).map((u: any) => (
                <Item key={u.id}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.email ?? u.id}</div>
                    <div style={{ color: '#9fb6c9', fontSize: 12 }}>{u.user_metadata?.name ?? ''}</div>
                  </div>
                  <div>
                    <GambaUi.Button onClick={() => navigator.clipboard.writeText(JSON.stringify(u, null, 2))}>Copy</GambaUi.Button>
                  </div>
                </Item>
              ))}
            </List>
          </Section>
        )}

        {content?.type === 'featureFlags' && (
          <Section>
            <Row>
              <div style={{ fontWeight: 600 }}>Feature Flags</div>
            </Row>
            <List>
              {(content.payload?.body?.data ?? []).map((f: any) => (
                <Item key={f.key}>
                  <div style={{ fontWeight: 600 }}>{f.key}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <GambaUi.Button onClick={async () => {
                      // toggle flag
                      const updated = await fetch(`/api/admin/feature-flags`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-key': (window as any).__ADMIN_KEY__ || '', 'x-wallet-address': (window as any).__WALLET_ADDRESS__ || '' }, body: JSON.stringify({ key: f.key, value: !f.value }) })
                      const text = await updated.text()
                      // reload content by replacing location (simpler) — admin page already fetches fresh on next open
                      window.location.reload()
                    }}>Toggle</GambaUi.Button>
                  </div>
                </Item>
              ))}
            </List>
          </Section>
        )}

        {content?.type === 'rateStatus' && (
          <Section>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{JSON.stringify(content.payload?.payload ?? content.payload, null, 2)}</pre>
          </Section>
        )}

        {content?.type === 'rpcHealth' && (
          <Section>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{JSON.stringify(content.payload?.payload ?? content.payload, null, 2)}</pre>
          </Section>
        )}

        {content?.type === 'cacheClear' && (
          <Section>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{JSON.stringify(content.payload ?? {}, null, 2)}</pre>
          </Section>
        )}

      </ModalContent>
    </Modal>
  )
}

export default AdminModal
