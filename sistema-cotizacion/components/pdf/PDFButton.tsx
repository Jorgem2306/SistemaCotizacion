'use client';

import dynamic from 'next/dynamic';
import { CotizacionItemForm, Cliente, Configuracion } from '@/types';

const PDFDownloadButtonInner = dynamic(
  () => import('./PDFDownloadButtonInner'),
  {
    ssr: false,
    loading: () => (
      <button className="btn btn-success btn-lg" disabled style={{ width: '100%', justifyContent: 'center' }}>
        ⏳ Cargando...
      </button>
    ),
  }
);

interface Props {
  numero: string;
  fecha: string;
  cliente: Cliente;
  items: CotizacionItemForm[];
  config: Configuracion;
  totalGeneral: number;
  fileName: string;
  condicionesVenta?: string;
  onAutoSave?: () => Promise<boolean>;
}

export default function PDFButton(props: Props) {
  return <PDFDownloadButtonInner {...props} />;
}
