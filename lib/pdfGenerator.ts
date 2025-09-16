import jsPDF from 'jspdf';

interface Answer {
  id: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  answeredAt: string;
  question: {
    question: string;
    type: string;
    category: string;
    difficulty: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
}

interface CategoryBreakdown {
  score: number;
  maxScore: number;
  percentage: number;
}

interface TestSession {
  id: string;
  testId: string;
  userId: string;
  status: string;
  score: number;
  maxScore: number;
  startTime: string;
  endTime: string;
  overallPercentage: number;
  categoryBreakdown: {
    TES_VERBAL: CategoryBreakdown;
    TES_ANGKA: CategoryBreakdown;
    TES_LOGIKA: CategoryBreakdown;
    TES_GAMBAR: CategoryBreakdown;
  };
  // RIASEC scores
  score_realistic?: number;
  score_investigative?: number;
  score_artistic?: number;
  score_social?: number;
  score_enterprising?: number;
  score_conventional?: number;
  max_score_realistic?: number;
  max_score_investigative?: number;
  max_score_artistic?: number;
  max_score_social?: number;
  max_score_enterprising?: number;
  max_score_conventional?: number;
  holland_code?: string;
  test: {
    name: string;
    description: string;
    duration: number;
  };
  test_name: string;
  test_description: string;
  test_duration: number;
  user_name: string;
  user_email: string;
  user_registration_id: string;
  answers: Answer[];
}

export const generateTestResultPDF = (session: TestSession) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const calculatePercentage = (score: number, maxScore: number) => {
    if (maxScore === 0) return 0;
    return Math.round((score / maxScore) * 100);
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 80) return "Excellent! Anda sangat baik!";
    if (percentage >= 60) return "Good! Anda cukup baik!";
    return "Keep trying! Anda perlu belajar lebih giat!";
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return [34, 197, 94]; // green-500
    if (percentage >= 60) return [234, 179, 8]; // yellow-500
    return [239, 68, 68]; // red-500
  };

  const drawBadge = (x: number, y: number, text: string, bgColor: number[], textColor: number[] = [255, 255, 255]) => {
    const textWidth = pdf.getTextWidth(text);
    const badgeWidth = textWidth + 8;
    const badgeHeight = 6;
    
    // Draw badge background
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.roundedRect(x, y, badgeWidth, badgeHeight, 3, 3, 'F');
    
    // Draw text
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFontSize(8);
    pdf.text(text, x + 4, y + 4);
  };

  const drawCard = (x: number, y: number, width: number, height: number, fillColor?: number[]) => {
    // Draw shadow
    pdf.setFillColor(0, 0, 0, 0.1);
    pdf.roundedRect(x + 1, y + 1, width, height, 2, 2, 'F');
    
    // Draw card background
    if (fillColor) {
      pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    } else {
      pdf.setFillColor(255, 255, 255);
    }
    pdf.roundedRect(x, y, width, height, 2, 2, 'F');
    
    // Draw border
    pdf.setDrawColor(229, 231, 235); // gray-200
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, y, width, height, 2, 2, 'S');
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "TES_VERBAL":
        return "Tes Verbal";
      case "TES_ANGKA":
        return "Tes Angka";
      case "TES_LOGIKA":
        return "Tes Logika";
      case "TES_GAMBAR":
        return "Tes Gambar";
      default:
        return category;
    }
  };

  const calculateZScore = (percentage: number) => {
    const populationMean = 65;
    const standardDeviation = 15;
    const zScore = (percentage - populationMean) / standardDeviation;
    return zScore.toFixed(2);
  };

  const addNewPageIfNeeded = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }
  };

  const wrapText = (text: string, maxWidth: number, fontSize: number = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    return lines;
  };

  const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number = 2) => {
    pdf.roundedRect(x, y, width, height, radius, radius, 'FD');
  };



  // Header with matching web layout
  pdf.setFillColor(59, 130, 246); // blue-500 background
  pdf.rect(0, 0, pageWidth, 25, 'F');
  
  pdf.setTextColor(255, 255, 255); // white text
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detail Hasil Tes', pageWidth / 2, 16, { align: 'center' });
  
  currentY = 35;

  // Informasi Tes Section with card layout
  addNewPageIfNeeded(80);
  
  // Section title
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Informasi Tes', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // Three column cards layout
  const cardWidth = (contentWidth - 10) / 3; // 5mm gap between cards
  const cardHeight = 45;
  const cardY = currentY;

  // Data Peserta Card
  drawCard(margin, cardY, cardWidth, cardHeight);
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Data Peserta', margin + 5, cardY + 8);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(55, 65, 81); // gray-700
  let textY = cardY + 16;
  pdf.text('Nama:', margin + 5, textY);
  pdf.setTextColor(17, 24, 39); // gray-900
  pdf.text(session.user_name || "N/A", margin + 20, textY);
  
  textY += 6;
  pdf.setTextColor(55, 65, 81);
  pdf.text('Email:', margin + 5, textY);
  pdf.setTextColor(17, 24, 39);
  const emailText = wrapText(session.user_email || "N/A", cardWidth - 25, 9);
  pdf.text(emailText[0], margin + 20, textY);
  
  textY += 6;
  pdf.setTextColor(55, 65, 81);
  pdf.text('ID Peserta:', margin + 5, textY);
  pdf.setTextColor(17, 24, 39);
  pdf.setFont('helvetica', 'normal');
  const idText = session.user_registration_id || session.userId || "N/A";
  pdf.text(idText.length > 15 ? idText.substring(0, 15) + "..." : idText, margin + 25, textY);

  // Data Tes Card
  const card2X = margin + cardWidth + 5;
  drawCard(card2X, cardY, cardWidth, cardHeight);
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Data Tes', card2X + 5, cardY + 8);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  textY = cardY + 16;
  pdf.setTextColor(55, 65, 81);
  pdf.text('Tes:', card2X + 5, textY);
  pdf.setTextColor(17, 24, 39);
  const testName = session.test_name || session.test?.name || "N/A";
  pdf.text(testName.length > 12 ? testName.substring(0, 12) + "..." : testName, card2X + 18, textY);
  
  textY += 6;
  pdf.setTextColor(55, 65, 81);
  pdf.text('Durasi:', card2X + 5, textY);
  pdf.setTextColor(17, 24, 39);
  pdf.text(`${session.test_duration || session.test?.duration || 0} menit`, card2X + 22, textY);
  
  textY += 6;
  pdf.setTextColor(55, 65, 81);
  pdf.text('Mulai:', card2X + 5, textY);
  pdf.setTextColor(17, 24, 39);
  const startDate = new Date(session.startTime).toLocaleDateString("id-ID");
  pdf.text(startDate, card2X + 20, textY);

  // Status Tes Card
  const card3X = margin + (cardWidth + 5) * 2;
  drawCard(card3X, cardY, cardWidth, cardHeight);
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Status Tes', card3X + 5, cardY + 8);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  textY = cardY + 16;
  pdf.setTextColor(55, 65, 81);
  pdf.text('Status:', card3X + 5, textY);
  
  const statusText = session.status === "COMPLETED" ? "Selesai" : 
                    session.status === "ONGOING" ? "Sedang Berlangsung" : "Ditinggalkan";
  const statusColor = session.status === "COMPLETED" ? [34, 197, 94] : [239, 68, 68];
  pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  pdf.text(statusText, card3X + 22, textY);
  
  if (session.status === "COMPLETED") {
    textY += 6;
    pdf.setTextColor(55, 65, 81);
    pdf.text('Nilai:', card3X + 5, textY);
    pdf.setTextColor(17, 24, 39);
    pdf.text(`${session.score || 0} dari ${session.maxScore || 0}`, card3X + 20, textY);
    
    textY += 6;
    pdf.setTextColor(55, 65, 81);
    pdf.text('Waktu:', card3X + 5, textY);
    pdf.setTextColor(17, 24, 39);
    if (session.endTime && session.startTime) {
      const durationMs = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
      const minutes = Math.floor(durationMs / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      pdf.text(`${minutes}m ${seconds}s`, card3X + 22, textY);
    }
  }

  currentY = cardY + cardHeight + 15;

  // Results Section for completed tests
  if (session.status === "COMPLETED") {
    addNewPageIfNeeded(100);
    
    // Hasil Akhir Section
    drawCard(margin, currentY, contentWidth, 60);
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Hasil Akhir', pageWidth / 2, currentY + 12, { align: 'center' });
    
    // Four column results layout
    const resultColWidth = contentWidth / 4;
    const resultY = currentY + 25;
    
    // Nilai
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128); // gray-500
    pdf.text('Nilai', margin + resultColWidth * 0.5, resultY, { align: 'center' });
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    const scoreColor = getScoreColor(session.overallPercentage || calculatePercentage(session.score, session.maxScore));
    pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    pdf.text(`${session.score}/${session.maxScore}`, margin + resultColWidth * 0.5, resultY + 12, { align: 'center' });
    
    // Persentase
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.text('Persentase', margin + resultColWidth * 1.5, resultY, { align: 'center' });
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    const percentage = session.overallPercentage || calculatePercentage(session.score, session.maxScore);
    pdf.text(`${percentage}%`, margin + resultColWidth * 1.5, resultY + 12, { align: 'center' });
    
    // Status
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.text('Status', margin + resultColWidth * 2.5, resultY, { align: 'center' });
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const passColor = percentage >= 60 ? [34, 197, 94] : [239, 68, 68]; // green or red
    pdf.setTextColor(passColor[0], passColor[1], passColor[2]);
    pdf.text(percentage >= 60 ? 'Lulus' : 'Gagal', margin + resultColWidth * 2.5, resultY + 12, { align: 'center' });
    
    // Pesan
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.text('Pesan', margin + resultColWidth * 3.5, resultY, { align: 'center' });
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(59, 130, 246); // blue-500
    const message = getScoreMessage(percentage);
    const messageLines = wrapText(message, resultColWidth - 10, 12);
    pdf.text(messageLines[0], margin + resultColWidth * 3.5, resultY + 12, { align: 'center' });
    
    currentY += 75;

    // RIASEC Scores Section (if available)
    if (session.score_realistic !== undefined || session.score_investigative !== undefined) {
      addNewPageIfNeeded(120);
      
      drawCard(margin, currentY, contentWidth, 120, [240, 253, 244]); // green-50
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Hasil Tes RIASEC (Holland Code)', pageWidth / 2, currentY + 12, { align: 'center' });
      
      const riasecData = [
        { key: 'Realistic', score: session.score_realistic || 0, maxScore: session.max_score_realistic || 0 },
        { key: 'Investigative', score: session.score_investigative || 0, maxScore: session.max_score_investigative || 0 },
        { key: 'Artistic', score: session.score_artistic || 0, maxScore: session.max_score_artistic || 0 },
        { key: 'Social', score: session.score_social || 0, maxScore: session.max_score_social || 0 },
        { key: 'Enterprising', score: session.score_enterprising || 0, maxScore: session.max_score_enterprising || 0 },
        { key: 'Conventional', score: session.score_conventional || 0, maxScore: session.max_score_conventional || 0 }
      ];
      
      const riasecColWidth = contentWidth / 3;
      const riasecRowHeight = 25;
      
      riasecData.forEach((item, index) => {
        const riasecX = margin + (index % 3) * riasecColWidth;
        const riasecY = currentY + 25 + Math.floor(index / 3) * riasecRowHeight;
        const riasecPercentage = item.maxScore > 0 ? Math.round((item.score / item.maxScore) * 100) : 0;
        
        // RIASEC item card
        drawCard(riasecX + 5, riasecY, riasecColWidth - 10, riasecRowHeight - 5, [248, 250, 252]); // gray-50
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(item.key, riasecX + 10, riasecY + 8);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        pdf.text(`${item.score}/${item.maxScore}`, riasecX + 10, riasecY + 15);
        
        // Percentage with color
        const riasecColor = getScoreColor(riasecPercentage);
        pdf.setTextColor(riasecColor[0], riasecColor[1], riasecColor[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${riasecPercentage}%`, riasecX + 40, riasecY + 15);
      });
      
      // Holland Code
      if (session.holland_code) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(37, 99, 235); // blue-600
        pdf.text('Kode Holland:', margin + 10, currentY + 85);
        pdf.setFontSize(16);
        pdf.text(session.holland_code, margin + 50, currentY + 85);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        pdf.text('Berdasarkan kode Holland ini, Anda cocok untuk bidang karir', margin + 10, currentY + 95);
        pdf.text('yang menggabungkan karakteristik dari dimensi-dimensi tertinggi Anda.', margin + 10, currentY + 102);
      }
      
      currentY += 135;
    }

    // Detailed Answer Breakdown Section
    if (session.answers && session.answers.length > 0) {
      addNewPageIfNeeded(150);
      
      drawCard(margin, currentY, contentWidth, 30);
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detail Jawaban Lengkap', pageWidth / 2, currentY + 20, { align: 'center' });
      
      currentY += 45;
      
      session.answers.forEach((answer, index) => {
        addNewPageIfNeeded(80);
        
        // Answer card
        drawCard(margin, currentY, contentWidth, 75);
        
        // Question header
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Soal ${index + 1}`, margin + 5, currentY + 10);
        
        // Correct/Wrong badge
        const badgeColor = answer.isCorrect ? [34, 197, 94] : [239, 68, 68]; // green or red
        const badgeText = answer.isCorrect ? 'Benar' : 'Salah';
        drawBadge(contentWidth - 25, currentY + 5, badgeText, badgeColor);
        
        // Points
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`${answer.pointsEarned} poin`, contentWidth - 25, currentY + 15);
        
        // Question text
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        pdf.text('Pertanyaan:', margin + 5, currentY + 20);
        
        const questionLines = wrapText(answer.question.question, contentWidth - 20, 10);
        questionLines.forEach((line: string, lineIndex: number) => {
          pdf.setTextColor(17, 24, 39);
          pdf.text(line, margin + 5, currentY + 28 + (lineIndex * 5));
        });
        
        let answerY = currentY + 28 + (questionLines.length * 5) + 5;
        
        // Your answer vs Correct answer
        pdf.setFontSize(9);
        pdf.setTextColor(55, 65, 81);
        pdf.text('Jawaban Anda:', margin + 5, answerY);
        
        const yourAnswerColor = answer.isCorrect ? [34, 197, 94] : [239, 68, 68];
        pdf.setTextColor(yourAnswerColor[0], yourAnswerColor[1], yourAnswerColor[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.text(answer.selectedAnswer || 'Tidak dijawab', margin + 35, answerY);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        pdf.text('Jawaban Benar:', margin + 90, answerY);
        pdf.setTextColor(34, 197, 94); // green
        pdf.setFont('helvetica', 'bold');
        pdf.text(answer.question.correctAnswer, margin + 125, answerY);
        
        // Explanation (if available)
        if (answer.question.explanation) {
          answerY += 8;
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(55, 65, 81);
          pdf.text('Penjelasan:', margin + 5, answerY);
          
          const explanationLines = wrapText(answer.question.explanation, contentWidth - 20, 9);
          explanationLines.forEach((line: string, lineIndex: number) => {
            pdf.setTextColor(107, 114, 128);
            pdf.text(line, margin + 5, answerY + 5 + (lineIndex * 4));
          });
        }
        
        currentY += 85;
      });
    }

    currentY += 15;

    // Category Breakdown Section
    if (session.categoryBreakdown) {
      addNewPageIfNeeded(120);
      
      drawCard(margin, currentY, contentWidth, 100);
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Breakdown per Kategori', pageWidth / 2, currentY + 12, { align: 'center' });
      
      const categories = Object.entries(session.categoryBreakdown);
      const catColWidth = contentWidth / 2;
      const catRowHeight = 35;
      
      categories.forEach((category, index) => {
        const [key, data] = category;
        const categoryName = getCategoryName(key);
        const catX = margin + (index % 2) * catColWidth;
        const catY = currentY + 25 + Math.floor(index / 2) * catRowHeight;
        
        // Category card
        drawCard(catX + 5, catY, catColWidth - 10, catRowHeight - 5, [248, 250, 252]); // gray-50
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(categoryName, catX + 10, catY + 8);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        pdf.text(`${data.score}/${data.maxScore}`, catX + 10, catY + 16);
        
        // Percentage with color
        const catColor = getScoreColor(data.percentage);
        pdf.setTextColor(catColor[0], catColor[1], catColor[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${data.percentage}%`, catX + 40, catY + 16);
        
        // Progress bar
        const barWidth = catColWidth - 30;
        const barHeight = 3;
        const barX = catX + 10;
        const barY = catY + 20;
        
        // Background bar
        pdf.setFillColor(229, 231, 235); // gray-200
        pdf.rect(barX, barY, barWidth, barHeight, 'F');
        
        // Progress bar
        pdf.setFillColor(catColor[0], catColor[1], catColor[2]);
        const progressWidth = (barWidth * Math.min(data.percentage, 100)) / 100;
        pdf.rect(barX, barY, progressWidth, barHeight, 'F');
        
        // Status badge
        pdf.setFontSize(7);
        const badgeText = data.percentage >= 80 ? "Sangat Baik" : 
                         data.percentage >= 60 ? "Baik" : "Perlu Perbaikan";
        const badgeColor = data.percentage >= 80 ? [220, 252, 231] : // green-100
                          data.percentage >= 60 ? [254, 249, 195] : [254, 226, 226]; // yellow-100 or red-100
        const badgeTextColor = data.percentage >= 80 ? [22, 101, 52] : // green-800
                              data.percentage >= 60 ? [133, 77, 14] : [153, 27, 27]; // yellow-800 or red-800
        
        pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
         pdf.roundedRect(catX + 10, catY + 25, 25, 4, 1, 1, 'F');
         pdf.setTextColor(badgeTextColor[0], badgeTextColor[1], badgeTextColor[2]);
         pdf.text(badgeText, catX + 22.5, catY + 28, { align: 'center' });
      });
      
      currentY += 105;
    }

    // Z-Score and Interpretation Section
    addNewPageIfNeeded(80);
    
    const statsColWidth = contentWidth / 2;
    
    // Z-Score Statistics Card
    drawCard(margin, currentY, statsColWidth - 5, 60, [239, 246, 255]); // blue-50
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Statistik Z-Score', margin + 5, currentY + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);
    pdf.text('Z-Score:', margin + 5, currentY + 20);
    pdf.setTextColor(37, 99, 235); // blue-600
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(calculateZScore(percentage), margin + 30, currentY + 20);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);
    pdf.text('Persentil:', margin + 5, currentY + 32);
    pdf.setTextColor(31, 41, 55); // gray-800
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${percentage}%`, margin + 30, currentY + 32);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text('Detail:', margin + 5, currentY + 44);
    pdf.text('Posisi relatif di atas rata-rata populasi', margin + 20, currentY + 44);
    
    // Interpretation Card
    drawCard(margin + statsColWidth + 5, currentY, statsColWidth - 5, 60, [240, 253, 244]); // green-50
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Interpretasi & Rekomendasi', margin + statsColWidth + 10, currentY + 10);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);
    pdf.text('Kategori:', margin + statsColWidth + 10, currentY + 20);
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'bold');
    const categoryText = percentage >= 80 ? "Sangat Baik" : 
                        percentage >= 60 ? "Baik" : "Perlu Perbaikan";
    pdf.text(categoryText, margin + statsColWidth + 35, currentY + 20);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);
    pdf.text('Rekomendasi:', margin + statsColWidth + 10, currentY + 32);
    const recommendation = percentage >= 80 ? 
      "Pertahankan prestasi yang sangat baik ini!" :
      percentage >= 60 ? 
      "Tingkatkan latihan untuk hasil yang lebih baik" :
      "Perbanyak latihan dan pelajari materi lebih dalam";
    
    const recLines = wrapText(recommendation, statsColWidth - 20, 9);
    recLines.forEach((line: string, index: number) => {
      pdf.text(line, margin + statsColWidth + 10, currentY + 40 + (index * 5));
    });
    
    currentY += 75;
  }

  // Footer
  const now = new Date();
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Dicetak pada: ${formatDate(now.toISOString())}`, margin, pageHeight - 10);
  pdf.text(`Halaman ${pdf.internal.getNumberOfPages()}`, pageWidth - margin - 20, pageHeight - 10);

  return pdf;
};