import pdfplumber
import os
import json
import re

INPUT_DIR = r"c:\Users\sione.likiliki\Documents\TF-Dashboard\docs"
OUTPUT_FILE = r"c:\Users\sione.likiliki\Documents\TF-Dashboard\prisma\data\imported_data.json"

def parse_pdfs(directory):
    pdf_files = [f for f in os.listdir(directory) if f.lower().endswith('.pdf')]
    
    # Structure: team -> name -> { weight: [], km: [], ... }
    data_store = {}
    
    for pdf_file in pdf_files:
        metric_type = "unknown"
        if "weight" in pdf_file: metric_type = "weight"
        elif "km" in pdf_file: metric_type = "km"
        elif "lifestyle" in pdf_file: metric_type = "lifestyle"
        elif "attendance" in pdf_file: metric_type = "attendance"
        
        print(f"Processing {pdf_file} as {metric_type}...")
        
        file_path = os.path.join(directory, pdf_file)
        
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    tables = page.extract_tables()
                    
                    for table in tables:
                        # Identify headers or current group
                        current_group = None
                        
                        for row in table:
                            # Clean row
                            row = [str(cell).strip().replace('\n', ' ') if cell is not None else '' for cell in row]
                            
                            first_cell = row[0]
                            
                            # Check for Header Row
                            if "Member" in first_cell and "Week 1" in row[1]:
                                continue
                            
                            # Check for Group Header
                            # "Group 1 (Team)" or just "Group 1"
                            if "Group" in first_cell and ("Team" in first_cell or len(row) < 3 or not row[1]):
                                # Extract Group Name
                                current_group = first_cell.replace('(Team)', '').strip()
                                if current_group not in data_store:
                                    data_store[current_group] = {}
                                continue
                            
                            # Check for Total Row
                            if "Totals" in first_cell:
                                continue
                                
                            # Must be a member row
                            if current_group and first_cell:
                                name = first_cell
                                # Cleanup name (remove non-alpha if needed, but pdfplumber usually gives clean text)
                                name = re.sub(r'[^a-zA-Z\s\']', '', name).strip()
                                
                                if not name: continue
                                
                                # Data columns are index 1 to ... (excluding Total)
                                # Table headers: Member | W1 | ... | W8 | Total
                                # We want W1...W8.
                                # row[1:-1] excludes Member data (index 0) and Total (index -1)
                                values = row[1:-1]
                                
                                if name not in data_store[current_group]:
                                    data_store[current_group][name] = {'name': name, 'team': current_group}
                                
                                # Padding Logic for Seed Script Compatibility
                                # Weight: No padding (Index 0 is Start)
                                # Others: Pad with "PAD" so Index 1 matches Week 1
                                final_values = values
                                if metric_type != "weight":
                                    final_values = ["PAD"] + values
                                
                                data_store[current_group][name][metric_type] = final_values

        except Exception as e:
            print(f"Error parsing {pdf_file}: {e}")

    return data_store

def save_json(data_store):
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    flat_list = []
    for team, members in data_store.items():
        for name, record in members.items():
            flat_list.append(record)
            
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(flat_list, f, indent=2)
    print(f"Saved {len(flat_list)} records to {OUTPUT_FILE}")

if __name__ == "__main__":
    data = parse_pdfs(INPUT_DIR)
    save_json(data)
