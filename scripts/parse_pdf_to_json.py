import json
import re
import os

INPUT_FILE = r"c:\Users\sione.likiliki\Documents\TF-Dashboard\docs\extracted_data.txt"
OUTPUT_FILE = r"c:\Users\sione.likiliki\Documents\TF-Dashboard\prisma\data\imported_data.json"

def parse_data(file_path):
    with open(file_path, 'r', encoding='utf-16') as f:
        content = f.read()

    # Split by file sections
    sections = content.split("--- Processing")
    
    # Store by Team -> Name string to easy lookups
    # data_store[team_name][member_name] = { ... }
    data_store = {}

    for section in sections:
        if not section.strip(): continue
        
        lines = section.split('\n')
        header = lines[0]
        metric_type = "unknown"
        if "weight" in header: metric_type = "weight"
        elif "km" in header: metric_type = "km"
        elif "lifestyle" in header: metric_type = "lifestyle"
        elif "attendance" in header: metric_type = "attendance"
        
        print(f"Processing section: {header.strip()} -> Metric: {metric_type}")

        current_team = None
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            # Detect Team Header
            team_match = re.search(r"(Group\s+\d+.*)", line)
            if team_match and "Totals" not in line and "Week" not in line:
                current_team = team_match.group(1).strip()
                if current_team not in data_store:
                    data_store[current_team] = {}
                continue

            if current_team:
                if "Week" in line or "Total" in line: continue
                
                # Check if line looks like it has data
                # Attendance often looks like: "Name 3/3 2/3 ..."
                # Regex to separate Name from Data
                
                # 1. Clean data: Replace '3/3' with '1' (or keep as string?) 
                # For now let's just capture the parts.
                
                # Split by space
                parts = line.split()
                if len(parts) < 2: continue
                
                name_parts = []
                data_values = []
                
                for part in parts:
                    # Check for Attendance format X/Y (e.g. 3/3)
                    if re.match(r'\d+/\d+', part):
                        # It is attendance data
                        data_values.append(part)
                    elif part.replace('.','').replace('-','').replace('+','').isdigit() or part == '-':
                        # It is numeric data
                        data_values.append(part)
                    elif re.match(r'^-?\d+(\.\d+)?$', part.replace('+','')):
                         data_values.append(part)
                    else:
                        # It is likely part of the name
                        # Filter out garbage
                        if len(part) > 1 or part.isalpha():
                             name_parts.append(part)
                
                name = " ".join(name_parts)
                # Cleanup name: sometimes trailing garbage remains
                name = re.sub(r'[^a-zA-Z\s\']', '', name).strip()
                
                if not name or len(data_values) == 0: continue
                
                # Retrieve or Init Member Record
                if name not in data_store[current_team]:
                    data_store[current_team][name] = {'name': name, 'team': current_team}
                
                # Store the data
                # Note: Attendance might be split across lines or just one line?
                # The visual showed "Name 3/3 3/3..."
                existing_data = data_store[current_team][name].get(metric_type, [])
                if not existing_data:
                     data_store[current_team][name][metric_type] = data_values
                else:
                    # If we somehow get duplicate lines/split lines, extend?
                    # For now, simplistic overwrite/extend might be risky.
                    # But often the text extraction splits lines.
                    pass

    return data_store

def save_json(data_store):
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    # Flatten
    flat_list = []
    for team, members in data_store.items():
        for name, record in members.items():
            flat_list.append(record)
            
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(flat_list, f, indent=2)
    print(f"Saved {len(flat_list)} records to {OUTPUT_FILE}")

if __name__ == "__main__":
    data = parse_data(INPUT_FILE)
    save_json(data)
