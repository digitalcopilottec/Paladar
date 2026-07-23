import React from 'react';
import BuffetSale from '../components/BuffetSale.jsx';
import Logo from '../components/Logo.jsx';

/**
 * App do atendente no celular (rota /atendente). Fora do menu lateral — o buffet
 * também vive no PDV → aba Buffet. Mantido para uso direto no celular.
 */
export default function Atendente() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
        background: '#fff', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 5 }}>
        <Logo variant="red" compact className="mk36" />
        <b style={{ fontSize: 18, letterSpacing: '.05em' }}>ATENDENTE</b>
      </div>
      <div style={{ padding: 20, maxWidth: 560, margin: '0 auto' }}>
        <BuffetSale />
      </div>
    </div>
  );
}
