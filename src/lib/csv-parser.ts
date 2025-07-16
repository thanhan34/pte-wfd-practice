/**
 * Parse CSV content and extract phrases
 */
export function parseCSV(csvContent: string): string[] {
  const lines = csvContent.split('\n');
  const phrases: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV with quotes and commas
    let phrase = '';
    let inQuotes = false;
    let j = 0;
    
    // Skip to first column (assume phrases are in first column)
    while (j < line.length) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // End of first column
        break;
      } else if (inQuotes || char !== '"') {
        phrase += char;
      }
      
      j++;
    }
    
    // Clean up the phrase
    phrase = phrase.trim();
    
    // Remove surrounding quotes if present
    if (phrase.startsWith('"') && phrase.endsWith('"')) {
      phrase = phrase.slice(1, -1);
    }
    
    // Validate phrase
    if (phrase.length > 0 && phrase.length <= 200) {
      phrases.push(phrase);
    }
  }
  
  return phrases;
}

/**
 * Validate CSV file
 */
export function validateCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      reject(new Error('Chỉ chấp nhận file CSV (.csv)'));
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('File quá lớn (tối đa 5MB)'));
      return;
    }
    
    // Read file content
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        reject(new Error('Không thể đọc file'));
        return;
      }
      
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Generate sample CSV content for download
 */
export function generateSampleCSV(): string {
  const samplePhrases = [
    "The lecture was about climate change",
    "Students should submit their assignments on time",
    "The research findings were quite surprising",
    "Technology has revolutionized modern education",
    "Environmental protection is everyone's responsibility",
    "The conference will be held next month",
    "Please complete the survey by Friday",
    "The new policy takes effect immediately",
    "All participants must register in advance",
    "The deadline has been extended until next week"
  ];
  
  // Create CSV with header
  let csv = "WFD Phrases\n";
  
  // Add phrases (with quotes to handle commas)
  samplePhrases.forEach(phrase => {
    csv += `"${phrase}"\n`;
  });
  
  return csv;
}

/**
 * Download sample CSV file
 */
export function downloadSampleCSV(): void {
  const csvContent = generateSampleCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'wfd-phrases-sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
