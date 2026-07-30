'use client';

import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { CotizacionItemForm, Cliente, Configuracion } from '@/types';

/* ── COLORES DIMATEX PERU ─────────────────────────────────── */
const D = {
  rojo:      '#E62A2B',
  rojoOsc:   '#b51e1f',
  naranja:   '#EC6935',
  amarillo:  '#FDE306',
  blanco:    '#ffffff',
  negro:     '#1a1a1a',
  grisOsc:   '#3a3a3a',
  gris:      '#6b6b6b',
  grisClaro: '#f4f4f4',
  borde:     '#e5e5e5',
  fila:      '#fafafa',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: D.blanco,
    paddingTop: 0,
    paddingBottom: 100,   // espacio para footer fijo
    paddingHorizontal: 0,
    fontSize: 7.5,
    fontFamily: 'Helvetica',
    color: D.negro,
  },

  /* ── ENCABEZADO ── */
  header: {
    backgroundColor: D.blanco,
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 72,
    borderBottomWidth: 3,
    borderBottomColor: D.rojo,
  },
  headerLeft: {
    width: 190,
    backgroundColor: D.blanco,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderRightWidth: 1,
    borderRightColor: D.borde,
  },
  headerLogoPrincipal: { width: 155, height: 55, objectFit: 'contain' },
  headerLogosRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginTop: 3 },
  headerLogoSmall: { width: 28, height: 16, objectFit: 'contain' },
  headerNombreFallback: { color: D.rojo, fontSize: 16, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  headerNombreSub: { color: D.gris, fontSize: 7 },

  headerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  headerCotizTitle: {
    fontSize: 8, fontFamily: 'Helvetica-Bold',
    color: D.gris, letterSpacing: 2, textTransform: 'uppercase',
  },
  headerCotizNum: {
    fontSize: 18, fontFamily: 'Helvetica-Bold',
    color: D.rojo, letterSpacing: 1, marginTop: 1,
  },
  headerFecha: {
    fontSize: 7, color: D.gris, marginTop: 2,
  },

  /* ── CUERPO ── */
  body: { paddingHorizontal: 24, paddingTop: 12 },

  /* ── SECCIÓN CLIENTE ── */
  clienteSection: {
    marginBottom: 10,
    borderWidth: 1, borderColor: D.borde, borderRadius: 4,
    overflow: 'hidden',
  },
  clienteHeader: {
    backgroundColor: D.naranja,
    paddingHorizontal: 10, paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clienteHeaderText: {
    color: D.blanco, fontSize: 6.5,
    fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, textTransform: 'uppercase',
  },
  clienteFieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10, paddingVertical: 6,
    gap: 0,
  },
  clienteField: {
    width: '33%', paddingRight: 8, paddingBottom: 4,
  },
  clienteLabel: { fontSize: 6, color: D.gris, textTransform: 'uppercase', marginBottom: 1 },
  clienteValue: { fontSize: 8, color: D.negro, fontFamily: 'Helvetica-Bold' },

  /* ── TABLA ── */
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: D.rojo,
    borderRadius: 3,
    marginBottom: 1,
    overflow: 'hidden',
  },
  th: {
    color: D.blanco, fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 0.4,
    paddingVertical: 6, paddingHorizontal: 6,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: D.borde,
    minHeight: 68,
  },
  tableRowAlt: { backgroundColor: D.fila },
  td: {
    paddingVertical: 6, paddingHorizontal: 6,
    justifyContent: 'center', fontSize: 7.5,
  },

  /* anchos columnas — modo normal (con CANT y TOTAL) */
  colPrenda: { width: '18%' },
  colCaract: { width: '28%' },
  colImg:    { width: '16%', alignItems: 'center' },
  colPrecio: { width: '13%', alignItems: 'center' },
  colCant:   { width: '10%', alignItems: 'center' },
  colTotal:  { width: '15%', alignItems: 'flex-end' },

  /* anchos columnas — modo sin CANT/TOTAL (todos qty=1) */
  colPrendaS: { width: '22%' },
  colCaractS: { width: '38%' },
  colImgS:    { width: '20%', alignItems: 'center' },
  colPrecioS: { width: '20%', alignItems: 'center' },

  itemNombre:  { fontFamily: 'Helvetica-Bold', fontSize: 8, color: D.negro, marginBottom: 2 },
  itemDesc:    { fontSize: 7, color: D.gris, lineHeight: 1.5 },
  itemImage:   { width: 68, height: 68, objectFit: 'cover', borderRadius: 3, borderWidth: 1, borderColor: D.borde },
  priceText:   { fontFamily: 'Helvetica-Bold', color: D.naranja, fontSize: 8.5 },
  totalText:   { fontFamily: 'Helvetica-Bold', color: D.negro, fontSize: 8.5 },
  cantText:    { textAlign: 'center', fontFamily: 'Helvetica-Bold', color: D.negro },

  /* ── TOTAL GENERAL ── */
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6, marginBottom: 10,
  },
  totalBox: {
    backgroundColor: D.rojo,
    borderRadius: 5,
    paddingHorizontal: 18, paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totalLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 7, textTransform: 'uppercase', letterSpacing: 1 },
  totalValue: { color: D.blanco, fontSize: 14, fontFamily: 'Helvetica-Bold' },

  /* ── CONDICIONES ── */
  condSection: { marginTop: 20, marginBottom: 10 },
  condTitle: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: D.rojo,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
    borderBottomWidth: 1, borderBottomColor: D.naranja, paddingBottom: 2,
  },
  condText: { fontSize: 7, color: D.gris, lineHeight: 1.65 },

  /* ── CUENTAS BANCARIAS ── */
  bankBox: {
    width: 250,
    backgroundColor: '#dcdcdc',
    borderWidth: 1.5,
    borderColor: D.negro,
    padding: 6,
  },
  bankLine: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: D.negro, marginBottom: 3 },
  bankIndent: { marginLeft: 30, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: D.negro, marginBottom: 3 },
  bankIndentDet: { marginLeft: 20, marginTop: 4, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: D.negro, marginBottom: 3 },

  /* ── FIRMA ── */
  firmaSection: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  firmaBox: { alignItems: 'center', width: 150 },
  firmaImg: { width: 110, height: 44, objectFit: 'contain', marginBottom: 3 },
  firmaLinea: { borderTopWidth: 1, borderTopColor: D.negro, width: '100%', marginBottom: 3 },
  firmaNombre: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: D.negro, textAlign: 'center' },
  firmaCargo: { fontSize: 6.5, color: D.gris, textAlign: 'center' },

  /* ── PIE DE PÁGINA FIJO ── */
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 100,
    backgroundColor: D.blanco,
    borderTopWidth: 2, borderTopColor: D.rojo,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  footerLogos: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  footerLogo: { width: 55, height: 28, objectFit: 'contain' },
  footerInfo: { alignItems: 'flex-end' },
  footerText: { fontSize: 6.5, color: D.gris, lineHeight: 1.6 },
  footerBold: { fontFamily: 'Helvetica-Bold', color: D.grisOsc },
});

interface Props {
  numero: string;
  fecha: string;
  cliente: Cliente;
  items: CotizacionItemForm[];
  itemImages: Record<string, string>;
  config: Configuracion;
  configImages: {
    logoPrincipal?: string;
    logoSecundario?: string;
    firma?: string;
    logosPie?: string[];
  };
  totalGeneral: number;
  condicionesVenta?: string;   // editables por cotización
}

export default function CotizacionPDF({
  numero, fecha, cliente, items, itemImages, config, configImages, totalGeneral, condicionesVenta,
}: Props) {
  const fechaStr = new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // ¿Todos los ítems tienen cantidad = 1?
  const allQty1 = items.every(i => i.cantidad === 1);

  // Campos del cliente (solo los que tienen valor)
  const clienteFields: { label: string; value: string }[] = [
    { label: 'Razón Social', value: cliente.razon_social },
    ...(cliente.ruc      ? [{ label: 'RUC',      value: cliente.ruc }]      : []),
    ...(cliente.contacto ? [{ label: 'Contacto', value: cliente.contacto }] : []),
    ...(cliente.correo   ? [{ label: 'Correo',   value: cliente.correo }]   : []),
    ...(cliente.telefono ? [{ label: 'Teléfono', value: cliente.telefono }] : []),
  ];

  return (
    <Document title={`Cotizacion-${numero}`} author="DIMATEX PERU">
      <Page size="A4" style={styles.page}>

        {/* ── ENCABEZADO ── */}
        <View style={styles.header}>
          {/* Lado izquierdo: solo logo principal */}
          <View style={styles.headerLeft}>
            {configImages.logoPrincipal ? (
              <Image src={configImages.logoPrincipal} style={styles.headerLogoPrincipal} />
            ) : (
              <View>
                <Text style={styles.headerNombreFallback}>DIMATEX</Text>
                <Text style={styles.headerNombreSub}>PERU</Text>
              </View>
            )}
          </View>

          {/* Centro: número de cotización */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerCotizTitle}>COTIZACIÓN</Text>
            <Text style={styles.headerCotizNum}>N° {numero}</Text>
            <Text style={styles.headerFecha}>Fecha: {fechaStr}</Text>
          </View>

          {/* Lado derecho: logo secundario si hay */}
          {configImages.logoSecundario && (
            <View style={{ width: 100, justifyContent: 'center', alignItems: 'center', padding: 8 }}>
              <Image src={configImages.logoSecundario} style={{ width: 80, height: 40, objectFit: 'contain' }} />
            </View>
          )}
        </View>

        {/* ── CUERPO ── */}
        <View style={styles.body}>

          {/* ── DATOS CLIENTE ── */}
          <View style={styles.clienteSection}>
            <View style={styles.clienteHeader}>
              <Text style={styles.clienteHeaderText}>DATOS DEL CLIENTE</Text>
            </View>
            <View style={styles.clienteFieldsRow}>
              {clienteFields.map((f) => (
                <View key={f.label} style={styles.clienteField}>
                  <Text style={styles.clienteLabel}>{f.label}</Text>
                  <Text style={styles.clienteValue}>{f.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── TABLA ── */}
          {/* Cabecera */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, allQty1 ? styles.colPrendaS : styles.colPrenda]}>PRENDA</Text>
            <Text style={[styles.th, allQty1 ? styles.colCaractS : styles.colCaract]}>CARACTERÍSTICAS</Text>
            <Text style={[styles.th, allQty1 ? styles.colImgS    : styles.colImg   ]}>IMAGEN</Text>
            <Text style={[styles.th, allQty1 ? styles.colPrecioS : styles.colPrecio]}>PRECIO</Text>
            {!allQty1 && <Text style={[styles.th, styles.colCant]}>CANT.</Text>}
            {!allQty1 && <Text style={[styles.th, styles.colTotal]}>TOTAL</Text>}
          </View>

          {/* Filas */}
          {items.map((item, i) => {
            const imgSrc = item.producto_id ? itemImages[item.producto_id] : itemImages[item.id];
            const total  = item.precio_unitario * item.cantidad;

            return (
              <View key={item.id} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
                {/* Prenda */}
                <View style={[styles.td, allQty1 ? styles.colPrendaS : styles.colPrenda]}>
                  <Text style={styles.itemNombre}>{item.nombre_prenda}</Text>
                </View>

                {/* Características */}
                <View style={[styles.td, allQty1 ? styles.colCaractS : styles.colCaract]}>
                  <Text style={styles.itemDesc}>{item.descripcion || '—'}</Text>
                </View>

                {/* Imagen */}
                <View style={[styles.td, allQty1 ? styles.colImgS : styles.colImg, { alignItems: 'center' }]}>
                  {imgSrc ? (
                    <Image src={imgSrc} style={styles.itemImage} />
                  ) : (
                    <View style={[styles.itemImage, { backgroundColor: D.grisClaro, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 20 }}>🧥</Text>
                    </View>
                  )}
                </View>

                {/* Precio */}
                <View style={[styles.td, allQty1 ? styles.colPrecioS : styles.colPrecio, { alignItems: 'center' }]}>
                  <Text style={styles.priceText}>
                    S/ {Number(item.precio_unitario).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                {/* Cantidad — solo si no todos son qty=1 */}
                {!allQty1 && (
                  <View style={[styles.td, styles.colCant, { alignItems: 'center' }]}>
                    <Text style={styles.cantText}>{item.cantidad}</Text>
                  </View>
                )}

                {/* Total — solo si no todos son qty=1 */}
                {!allQty1 && (
                  <View style={[styles.td, styles.colTotal, { alignItems: 'flex-end' }]}>
                    <Text style={styles.totalText}>
                      S/ {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* ── TOTAL GENERAL — solo si no todos qty=1 ── */}
          {!allQty1 && (
            <View style={styles.totalRow}>
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>TOTAL GENERAL</Text>
                <Text style={styles.totalValue}>
                  S/ {totalGeneral.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          )}

          {/* ── CONDICIONES Y CUENTAS BANCARIAS ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 10, gap: 15 }}>
            <View style={{ flex: 1 }}>
              {(condicionesVenta || config.condiciones_venta) && (
                <View>
                  <Text style={styles.condTitle}>CONDICIONES DE VENTA</Text>
                  <Text style={styles.condText}>{condicionesVenta || config.condiciones_venta}</Text>
                </View>
              )}
            </View>

            <View style={styles.bankBox}>
              <Text style={styles.bankLine}>• Cuenta Corriente Banco Continental - BBVA:</Text>
              <Text style={styles.bankIndent}>Soles: 0011-0183-0100150847</Text>
              <Text style={styles.bankIndent}>CCI: 011 - 183 - 000100150847 - 10</Text>
              <Text style={styles.bankIndentDet}>CUENTA DE DETRACCION BANCO DE LA NACION: 00-066-113825</Text>
            </View>
          </View>

          {/* ── FIRMA ── */}
          {(configImages.firma || config.emisor_nombre) && (
            <View style={styles.firmaSection}>
              <View style={styles.firmaBox}>
                {configImages.firma && <Image src={configImages.firma} style={styles.firmaImg} />}
                <View style={styles.firmaLinea} />
                {config.emisor_nombre && <Text style={styles.firmaNombre}>{config.emisor_nombre}</Text>}
                {config.emisor_cargo  && <Text style={styles.firmaCargo}>{config.emisor_cargo}</Text>}
              </View>
            </View>
          )}

        </View>

        {/* ── PIE DE PÁGINA — FIJO AL FINAL DE LA HOJA ── */}
        <View style={styles.footer} fixed>
          {/* Logos en el pie — blancos y bien espaciados */}
          <View style={styles.footerLogos}>
            {configImages.logosPie && configImages.logosPie.length > 0 ? (
              configImages.logosPie.map((src, i) =>
                src ? <Image key={i} src={src} style={styles.footerLogo} /> : null
              )
            ) : (
              <Text style={[styles.footerText, { fontFamily: 'Helvetica-Bold', color: D.rojo }]}>
                DIMATEX PERU
              </Text>
            )}
          </View>

          {/* Datos de empresa y Logo Principal */}
          <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {/* Logo Principal arriba del texto */}
            {configImages.logoPrincipal && (
              <Image src={configImages.logoPrincipal} style={{ width: 140, height: 48, objectFit: 'contain', objectPosition: 'right', marginBottom: 2 }} />
            )}

            <View style={styles.footerInfo}>
              {config.empresa_ruc && (
                <Text style={styles.footerText}>
                  <Text style={styles.footerBold}>RUC: </Text>{config.empresa_ruc}
                </Text>
              )}
              {config.empresa_direccion && (
                <Text style={styles.footerText}>{config.empresa_direccion}</Text>
              )}
              {config.empresa_telefono && (
                <Text style={styles.footerText}>
                  <Text style={styles.footerBold}>Tel: </Text>{config.empresa_telefono}
                </Text>
              )}
              {config.empresa_correo && (
                <Text style={styles.footerText}>{config.empresa_correo}</Text>
              )}
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
}
