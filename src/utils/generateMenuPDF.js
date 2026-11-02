import { jsPDF } from 'jspdf';

export async function generateMenuPDF(produtos, logoPath) {
  const doc = new jsPDF();
  
  // Cores da paleta
  const darkBrown = '#56270B';
  const mediumBrown = '#663b2b';
  const lightBeige = '#F9F6F3';
  const pink = '#FF6B9D';
  const green = '#7ED9D0';
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Fundo bege claro
  doc.setFillColor(lightBeige);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorações de fundo - círculos sutis nos cantos
  doc.setFillColor(239, 233, 229); // #EFE9E5 - bege mais escuro
  doc.circle(10, 10, 15, 'F'); // Canto superior esquerdo
  doc.circle(pageWidth - 10, 10, 15, 'F'); // Canto superior direito
  doc.circle(10, pageHeight - 10, 15, 'F'); // Canto inferior esquerdo
  doc.circle(pageWidth - 10, pageHeight - 10, 15, 'F'); // Canto inferior direito
  
  // Decoração lateral esquerda - linhas verticais sutis
  doc.setDrawColor(239, 233, 229);
  doc.setLineWidth(0.5);
  for (let i = 50; i < pageHeight - 50; i += 15) {
    doc.line(8, i, 8, i + 8);
  }
  
  // Decoração lateral direita - linhas verticais sutis
  for (let i = 50; i < pageHeight - 50; i += 15) {
    doc.line(pageWidth - 8, i, pageWidth - 8, i + 8);
  }
  
  // Adicionar logo (se disponível) - com proporção correta e menor
  try {
    const logoImg = await loadImage(logoPath);
    const logoWidth = 25;
    const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
    doc.addImage(logoImg, 'PNG', pageWidth / 2 - logoWidth / 2, 10, logoWidth, logoHeight);
  } catch (err) {
    console.error('Erro ao carregar logo:', err);
  }
  
  // Título - mais afastado da logo
  doc.setFontSize(24);
  doc.setTextColor(darkBrown);
  doc.setFont('helvetica', 'bold');
  doc.text('CARDÁPIO', pageWidth / 2, 58, { align: 'center' });
  
  // Linha decorativa sob o título - mais delicada
  doc.setDrawColor(mediumBrown);
  doc.setLineWidth(0.3);
  doc.line(50, 61, pageWidth - 50, 61);
  
  // Pequenos detalhes decorativos ao lado do título
  doc.setFillColor(mediumBrown);
  doc.circle(45, 58, 1.5, 'F');
  doc.circle(pageWidth - 45, 58, 1.5, 'F');
  
  let yPosition = 70;
  
  // Categorias e seus produtos - cores alternadas marrom e rosa
  const categorias = [
    { nome: 'BOLOS TRADICIONAIS', key: 'tradicionais', cor: mediumBrown },
    { nome: 'BOLOS DE POTE', key: 'pote', cor: pink },
    { nome: 'BEBIDAS', key: 'bebidas', cor: mediumBrown },
    { nome: 'SALGADOS', key: 'salgados', cor: pink }
  ];
  
  for (const categoria of categorias) {
    const produtosCategoria = produtos.filter(p => p.categoria === categoria.key);
    
    if (produtosCategoria.length === 0) continue;
    
    // Verificar se precisa de nova página
    if (yPosition > 240) {
      doc.addPage();
      doc.setFillColor(lightBeige);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      yPosition = 20;
    }
    
    // Card da categoria com fundo moderno - marrom ou rosa (mais delicado)
    doc.setFillColor(categoria.cor);
    doc.roundedRect(20, yPosition, pageWidth - 40, 8, 2, 2, 'F');
    
    // Nome da categoria
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(categoria.nome, pageWidth / 2, yPosition + 5.5, { align: 'center' });
    
    yPosition += 12;
    
    // Lista de produtos com linhas divisórias
    doc.setFontSize(9);
    doc.setTextColor(darkBrown);
    doc.setFont('helvetica', 'normal');
    
    produtosCategoria.forEach((produto, index) => {
      if (yPosition > 265) {
        doc.addPage();
        doc.setFillColor(lightBeige);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPosition = 20;
      }
      
      const preco = `R$ ${produto.valor.toFixed(2).replace('.', ',')}`;
      
      // Fundo alternado para melhor leitura (mais sutil)
      if (index % 2 === 0) {
        doc.setFillColor(250, 248, 246);
        doc.rect(22, yPosition - 2.5, pageWidth - 44, 5.5, 'F');
      }
      
      // Nome do produto (alinhado à esquerda)
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkBrown);
      doc.text(produto.titulo, 25, yPosition);
      
      // Preço (alinhado à direita)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(mediumBrown);
      doc.text(preco, pageWidth - 25, yPosition, { align: 'right' });
      
      // Linha divisória marrom entre produtos (mais delicada)
      if (index < produtosCategoria.length - 1) {
        doc.setDrawColor(209, 200, 194);
        doc.setLineWidth(0.1);
        doc.line(25, yPosition + 1.5, pageWidth - 25, yPosition + 1.5);
      }
      
      yPosition += 5.5;
    });
    
    yPosition += 6; // Espaço entre categorias
  }
  
  // Rodapé com informações organizadas
  const footerY = pageHeight - 35;
  
  // Linha decorativa antes do rodapé
  doc.setDrawColor(mediumBrown);
  doc.setLineWidth(0.3);
  doc.line(20, footerY - 2, pageWidth - 20, footerY - 2);
  
  doc.setFontSize(7.5);
  doc.setTextColor(darkBrown);
  
  // Endereço
  doc.setFont('helvetica', 'bold');
  doc.text('Endereço:', 20, footerY + 3);
  doc.setFont('helvetica', 'normal');
  doc.text('R. Aguanambi, 200 - Jardim Indaia - Guaianases', 20, footerY + 7);
  doc.text('São Paulo - SP, 08461-140', 20, footerY + 11);
  
  // Telefone
  doc.setFont('helvetica', 'bold');
  doc.text('Telefone:', 20, footerY + 17);
  doc.setFont('helvetica', 'normal');
  doc.text('(11) 2557-9693', 42, footerY + 17);
  
  // Horário de funcionamento
  doc.setFont('helvetica', 'bold');
  doc.text('Horário de funcionamento:', 20, footerY + 23);
  doc.setFont('helvetica', 'normal');
  doc.text('Segunda a Sábado: 09:00 às 19:00', 20, footerY + 27);
  doc.text('Domingo: Fechado', 20, footerY + 31);
  
  // Salvar PDF
  doc.save('Cardapio_Anjos_Bolos.pdf');
}

// Função auxiliar para carregar imagem
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
