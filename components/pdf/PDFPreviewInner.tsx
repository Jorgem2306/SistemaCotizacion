'use client';

// Solo se importa con dynamic({ ssr: false })
import { PDFViewer } from '@react-pdf/renderer';
import CotizacionPDF from './CotizacionPDF';
import { CotizacionItemForm, Cliente, Configuracion } from '@/types';

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

export default function PDFPreviewInner({ height = '680px', ...props }: Props) {
  return (
    <PDFViewer
      width="100%"
      height={height}
      style={{ border: 'none', borderRadius: '0 0 12px 12px' }}
    >
      <CotizacionPDF {...props} />
    </PDFViewer>
  );
}
