import Tesseract from 'tesseract.js'

export class OcrEngine {
  private static worker: Tesseract.Worker | null = null
  private static progressCallback: ((progress: number) => void) | null = null
  
  static async initialize(): Promise<void> {
    if (this.worker) return
    
    this.worker = await Tesseract.createWorker('eng+urd', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          if (this.progressCallback) this.progressCallback(m.progress);
          console.log('[OCR]', Math.round(m.progress * 100) + '%')
        }
      }
    })
    
    await this.worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD as any,
    })
  }
  
  static async extractText(imageData: string | Buffer, onProgress?: (progress: number) => void): Promise<string> {
    await this.initialize()
    this.progressCallback = onProgress || null
    try {
      const { data: { text } } = await this.worker!.recognize(imageData)
      return text.trim()
    } finally {
      this.progressCallback = null
    }
  }
  
  static async terminate(): Promise<void> {
    await this.worker?.terminate()
    this.worker = null
  }
}
