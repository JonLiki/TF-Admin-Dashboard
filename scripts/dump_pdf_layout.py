import pdfplumber
import os

def extract_layout(directory):
    pdf_files = [f for f in os.listdir(directory) if f.lower().endswith('.pdf')]
    
    with open(os.path.join(directory, 'extracted_layout.txt'), 'w', encoding='utf-8') as f_out:
        for pdf_file in pdf_files:
            file_path = os.path.join(directory, pdf_file)
            f_out.write(f"\n\n=== {pdf_file} ===\n\n")
            print(f"Processing {pdf_file}...")
            
            try:
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        # Try to extract tables first
                        tables = page.extract_tables()
                        if tables:
                            f_out.write(f"--- TABLES FOUND in {pdf_file} ---\n")
                            for table in tables:
                                for row in table:
                                    # Filter None
                                    clean_row = [str(cell).replace('\n', ' ') if cell is not None else '' for cell in row]
                                    f_out.write(" | ".join(clean_row) + "\n")
                            f_out.write("\n--- END TABLES ---\n")

                        # Also extract raw text with layout
                        text = page.extract_text(layout=True)
                        if text:
                            f_out.write(text)
                            f_out.write("\n")
            except Exception as e:
                f_out.write(f"Error processing {pdf_file}: {e}\n")

if __name__ == "__main__":
    extract_layout(r'c:\Users\sione.likiliki\Documents\TF-Dashboard\docs')
