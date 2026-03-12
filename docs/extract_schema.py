import os
from pypdf import PdfReader

def extract_text_from_pdfs(directory):
    pdf_files = [f for f in os.listdir(directory) if f.lower().endswith('.pdf')]
    
    all_text = ""
    
    for pdf_file in pdf_files:
        file_path = os.path.join(directory, pdf_file)
        print(f"--- Processing {pdf_file} ---")
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            print(text)
            all_text += f"\n--- END OF {pdf_file} ---\n"
        except Exception as e:
            print(f"Error reading {pdf_file}: {e}")

if __name__ == "__main__":
    extract_text_from_pdfs('.')
