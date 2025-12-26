<template>
  <div style="display: none;">
    <!-- Este componente contém apenas as funções para gerar PDF -->
  </div>
</template>

<script setup>
import { defineExpose } from 'vue';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import 'element-plus/es/components/message/style/css';

const getDriverName = (driverUniqueId) => {
  if (!driverUniqueId) return '-';
  try {
    const store = window.$store;
    if (store && store.getters) {
      const driver = store.getters['drivers/getDriverByUniqueId'](driverUniqueId);
      if (driver) {
        return driver.name || driver.uniqueId || driverUniqueId;
      }
    }
  } catch (e) {
    console.warn('Não foi possível acessar informação do motorista:', e);
  }
  return driverUniqueId;
};

const generateDetailedReport = async (routePoints, deviceInfo) => {
  try {
    // Calcular métricas
    const totalDistance = routePoints.reduce((sum, point) => sum + (point.attributes?.distance || 0), 0) / 1000;
    const speeds = routePoints.map(p => p.speed * 1.852);
    const maxSpeed = Math.max(...speeds, 0);
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    // Calcular horas de funcionamento e parada
    let totalOperationHours = 0;
    let totalStopHours = 0;
    for (let i = 1; i < routePoints.length; i++) {
      const diffInHours = dayjs(routePoints[i].deviceTime).diff(dayjs(routePoints[i-1].deviceTime), 'millisecond') / 3600000;
      if (routePoints[i-1].attributes?.ignition === true) {
        totalOperationHours += diffInHours;
      } else if (routePoints[i-1].attributes?.ignition === false) {
        totalStopHours += diffInHours;
      }
    }

    const startDate = routePoints.length > 0 ? dayjs(routePoints[0].deviceTime).format('DD/MM/YYYY HH:mm') : '';
    const endDate = routePoints.length > 0 ? dayjs(routePoints[routePoints.length - 1].deviceTime).format('DD/MM/YYYY HH:mm') : '';

    // Criar PDF
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 15;

    // Cores
    const primaryColor = [30, 87, 153];
    const greenColor = [39, 174, 96];
    const redColor = [231, 76, 60];
    const orangeColor = [243, 156, 18];
    const blueColor = [52, 152, 219];
    const purpleColor = [155, 89, 182];

    // ========== HEADER ==========
    doc.setFillColor(...primaryColor);
    doc.rect(10, 10, pageWidth - 20, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Histórico de Rota', 15, 22);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${dayjs().format('DD/MM/YYYY HH:mm')}`, pageWidth - 55, 22);
    
    yPos = 40;

    // ========== INFORMAÇÕES DO DISPOSITIVO ==========
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(10, yPos - 5, pageWidth - 20, 30, 3, 3, 'F');
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Informações do Dispositivo', 15, yPos + 3);
    
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Nome: ${deviceInfo?.name || 'Dispositivo'}`, 15, yPos + 12);
    doc.text(`ID: ${deviceInfo?.id || '-'}`, 15, yPos + 18);
    doc.text(`Placa: ${deviceInfo?.attributes?.placa || 'N/A'}`, 15, yPos + 24);
    
    doc.text(`Período: ${startDate} - ${endDate}`, 100, yPos + 12);
    
    yPos += 35;

    // ========== RESUMO DA ROTA ==========
    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo da Rota', 15, yPos);
    
    yPos += 5;
    
    // Cards de métricas - Linha 1
    const cardWidth = 57;
    const cardHeight = 20;
    const cardSpacing = 5;
    
    // Card 1 - Distância Total
    doc.setFillColor(...primaryColor);
    doc.roundedRect(10, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text('DISTÂNCIA TOTAL', 15, yPos + 6);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalDistance.toFixed(2)} km`, 15, yPos + 15);
    
    // Card 2 - Velocidade Máxima
    doc.setFillColor(...redColor);
    doc.roundedRect(10 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('VELOCIDADE MÁXIMA', 10 + cardWidth + cardSpacing + 5, yPos + 6);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${maxSpeed.toFixed(1)} km/h`, 10 + cardWidth + cardSpacing + 5, yPos + 15);
    
    // Card 3 - Velocidade Média
    doc.setFillColor(...greenColor);
    doc.roundedRect(10 + (cardWidth + cardSpacing) * 2, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('VELOCIDADE MÉDIA', 10 + (cardWidth + cardSpacing) * 2 + 5, yPos + 6);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${avgSpeed.toFixed(1)} km/h`, 10 + (cardWidth + cardSpacing) * 2 + 5, yPos + 15);
    
    yPos += cardHeight + cardSpacing;
    
    // Cards de métricas - Linha 2
    // Card 4 - Horas Funcionamento
    doc.setFillColor(...blueColor);
    doc.roundedRect(10, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('HRS FUNCIONAMENTO', 15, yPos + 6);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalOperationHours.toFixed(1)} h`, 15, yPos + 15);
    
    // Card 5 - Horas Parado
    doc.setFillColor(...orangeColor);
    doc.roundedRect(10 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('HRS PARADO', 10 + cardWidth + cardSpacing + 5, yPos + 6);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalStopHours.toFixed(1)} h`, 10 + cardWidth + cardSpacing + 5, yPos + 15);
    
    // Card 6 - Pontos Analisados
    doc.setFillColor(...purpleColor);
    doc.roundedRect(10 + (cardWidth + cardSpacing) * 2, yPos, cardWidth, cardHeight, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('PONTOS ANALISADOS', 10 + (cardWidth + cardSpacing) * 2 + 5, yPos + 6);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${routePoints.length}`, 10 + (cardWidth + cardSpacing) * 2 + 5, yPos + 15);
    
    yPos += cardHeight + 10;

    // ========== TABELA DE PONTOS ==========
    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhes dos Pontos', 15, yPos);
    
    // Limitar pontos para caber no PDF
    const maxPoints = 50;
    let displayedPoints = routePoints;
    if (routePoints.length > maxPoints) {
      displayedPoints = [...routePoints.slice(0, 25), ...routePoints.slice(routePoints.length - 25)];
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      yPos += 5;
      doc.text(`Exibindo ${displayedPoints.length} de ${routePoints.length} pontos para melhor visualização`, 15, yPos);
    }
    
    yPos += 5;

    // Preparar dados para a tabela
    const tableData = displayedPoints.map((point) => {
      const dateTime = dayjs(point.deviceTime).format('DD/MM HH:mm:ss');
      const speed = Math.round(point.speed * 1.852);
      const ignition = point.attributes?.ignition === true ? 'ON' : point.attributes?.ignition === false ? 'OFF' : '-';
      const blocked = point.attributes?.blocked === true ? 'Sim' : point.attributes?.blocked === false ? 'Não' : '-';
      const motion = point.attributes?.motion === true ? 'Mov' : point.attributes?.motion === false ? 'Par' : '-';
      const driverName = getDriverName(point.attributes?.driverUniqueId);
      const location = point.address ? 
        (point.address.length > 40 ? point.address.substring(0, 40) + '...' : point.address) :
        `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;

      return [dateTime, `${speed}`, ignition, blocked, motion, driverName, location];
    });

    // Gerar tabela com autoTable
    doc.autoTable({
      head: [['Data/Hora', 'Vel.', 'Ign', 'Bloq', 'Mov', 'Motorista', 'Localização']],
      body: tableData,
      startY: yPos,
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 25 },
        6: { cellWidth: 'auto' },
      },
      margin: { left: 10, right: 10 },
      didDrawPage: function (data) {
        // Rodapé em cada página
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Tarkan - Sistema de Rastreamento | Página ${data.pageNumber}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    });

    // Salvar
    const fileName = `Relatorio_${deviceInfo?.name || 'Dispositivo'}_${dayjs().format('YYYYMMDD_HHmm')}.pdf`;
    doc.save(fileName);

    ElMessage.success('PDF gerado com sucesso!');

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    ElMessage.error('Não foi possível gerar o PDF. Verifique o console para detalhes.');
  }
};

const generateTabularReport = async (routePoints, deviceInfo) => {
  try {
    // Usar jsPDF com autoTable para relatório tabular completo
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor = [30, 87, 153];
    
    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Relatório Tabular - ${deviceInfo?.name || 'Dispositivo'}`, 10, 10);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado: ${dayjs().format('DD/MM/YYYY HH:mm')} | Total: ${routePoints.length} pontos`, pageWidth - 80, 10);

    // Preparar dados para a tabela
    const tableData = routePoints.map((point) => {
      const dateTime = dayjs(point.deviceTime).format('DD/MM/YYYY HH:mm:ss');
      const speed = Math.round(point.speed * 1.852);
      const ignition = point.attributes?.ignition === true ? 'ON' : point.attributes?.ignition === false ? 'OFF' : '-';
      const blocked = point.attributes?.blocked === true ? 'Sim' : point.attributes?.blocked === false ? 'Não' : '-';
      const motion = point.attributes?.motion === true ? 'Movimento' : point.attributes?.motion === false ? 'Parado' : '-';
      const power = point.attributes?.power ? `${parseFloat(point.attributes.power).toFixed(1)}V` : '-';
      const driverName = getDriverName(point.attributes?.driverUniqueId);
      const location = point.address || `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;

      return [dateTime, `${speed} km/h`, ignition, blocked, motion, power, driverName, location];
    });

    // Gerar tabela
    doc.autoTable({
      head: [['Data/Hora', 'Velocidade', 'Ignição', 'Bloqueio', 'Movimento', 'Bateria', 'Motorista', 'Localização']],
      body: tableData,
      startY: 20,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'ellipsize',
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 16, halign: 'center' },
        6: { cellWidth: 30 },
        7: { cellWidth: 'auto' },
      },
      didDrawPage: function (data) {
        // Rodapé em cada página
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Tarkan - Sistema de Rastreamento | Página ${data.pageNumber}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }
    });

    // Salvar
    const fileName = `Relatorio_Tabular_${deviceInfo?.name || 'Dispositivo'}_${dayjs().format('YYYYMMDD_HHmm')}.pdf`;
    doc.save(fileName);

    ElMessage.success('PDF tabular gerado com sucesso!');

  } catch (error) {
    console.error('Erro ao gerar PDF tabular:', error);
    ElMessage.error('Não foi possível gerar o PDF tabular.');
  }
};

defineExpose({
  generateDetailedReport,
  generateTabularReport
});
</script>
