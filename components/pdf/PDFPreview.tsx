'use client';

import dynamic from 'next/dynamic';
import { CotizacionItemForm, Cliente, Configuracion } from '@/types';

const PDFPreviewInner = dynamic(() => import('./PDFPreviewInner'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 620, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#1f1f27', color: '#9999b3', gap: 16,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(230,42,43,0.2)', borderTopColor: '#E62A2B',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: 14 }}>Generando vista previa...</span>
    </div>
  ),
});

interface Props {
  numero: string;
  fecha: string;
  cliente: Cliente;
  items: CotizacionItemForm[];
  itemImages: Record<string, string>;
  config: Configuracion;
  configImages: {
    logoPrincipal?: string; logoSecundario?: string;
    firma?: string; logosPie?: string[];
  };
  totalGeneral: number;
  condicionesVenta?: string;
  height?: string;
}

export default function PDFPreview(props: Props) {
  return <PDFPreviewInner {...props} />;
}
