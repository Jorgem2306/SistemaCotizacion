'use client';

// Solo se importa vía dynamic({ ssr: false })
import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import CotizacionPDF from './CotizacionPDF';
import { CotizacionItemForm, Cliente, Configuracion } from '@/types';
import { urlToBase64 } from '@/lib/storage';
import { FileDown } from 'lucide-react';

interface Props {
  numero: string;
  fecha: string;
  cliente: Cliente;
  items: CotizacionItemForm[];
  config: Configuracion;
  totalGeneral: number;
  fileName: string;
  condicionesVenta?: string;
  /** Si se pasa, se llama antes de descargar (auto-guardar) */
  onAutoSave?: () => Promise<boolean>;
}

export default function PDFDownloadButtonInner({
  numero, fecha, cliente, items, config, totalGeneral, fileName, condicionesVenta, onAutoSave,
}: Props) {
  const [state, setState] = useState<'idle' | 'saving' | 'images' | 'pdf' | 'done'>('idle');

  async function handleDownload() {
    if (state !== 'idle' && state !== 'done') return;

    try {
      // 1. Auto-guardar si el callback fue provisto
      if (onAutoSave) {
        setState('saving');
        const saved = await onAutoSave();
        if (!saved) { setState('idle'); return; }
      }

      // 2. Convertir imágenes a base64
      setState('images');
      const itemImages: Record<string, string> = {};
      for (const item of items) {
        if (item.imagen_url) {
          const b64 = await urlToBase64(item.imagen_url);
          if (b64) itemImages[item.producto_id ?? item.id] = b64;
        }
      }

      const configImages: {
        logoPrincipal?: string; logoSecundario?: string;
        firma?: string; logosPie?: string[];
      } = {};
      if (config.logo_principal_url)  configImages.logoPrincipal  = (await urlToBase64(config.logo_principal_url))  || undefined;
      if (config.logo_secundario_url) configImages.logoSecundario = (await urlToBase64(config.logo_secundario_url)) || undefined;
      if (config.firma_url)           configImages.firma           = (await urlToBase64(config.firma_url))           || undefined;
      if (config.logos_pie_urls?.length) {
        configImages.logosPie = await Promise.all(config.logos_pie_urls.map(u => urlToBase64(u)));
      }

      // 3. Generar PDF blob
      setState('pdf');
      const blob = await pdf(
        <CotizacionPDF
          numero={numero} fecha={fecha} cliente={cliente}
          items={items} itemImages={itemImages}
          config={config} configImages={configImages}
          totalGeneral={totalGeneral}
          condicionesVenta={condicionesVenta}
        />
      ).toBlob();

      // 4. Disparar descarga → carpeta Descargas del navegador
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState('done');
      setTimeout(() => setState('idle'), 3000);
    } catch (err) {
      console.error('Error generando PDF:', err);
      setState('idle');
    }
  }

  const labels: Record<typeof state, string> = {
    idle:   '⬇ Generar y Descargar PDF',
    saving: '💾 Guardando...',
    images: '🖼 Cargando imágenes...',
    pdf:    '📄 Generando PDF...',
    done:   '✅ PDF descargado',
  };

  const isLoading = state === 'saving' || state === 'images' || state === 'pdf';

  return (
    <button
      className="btn btn-success btn-lg"
      onClick={handleDownload}
      disabled={isLoading}
      style={{ width: '100%', justifyContent: 'center' }}
    >
      {isLoading && (
        <span style={{
          display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
          animation: 'spin 0.7s linear infinite', marginRight: 8, flexShrink: 0,
        }} />
      )}
      {!isLoading && <FileDown size={16} style={{ marginRight: 6, flexShrink: 0 }} />}
      {labels[state]}
    </button>
  );
}
