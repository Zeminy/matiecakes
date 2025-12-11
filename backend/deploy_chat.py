import os
import glob

def deploy_chat_widget():
    # Target root directory (parent of backend)
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    html_files = glob.glob(os.path.join(root_dir, "*.html"))
    
    print(f"Scanning {len(html_files)} HTML files in {root_dir}")
    
    css_tag = "    <link rel=\"stylesheet\" href=\"src/styles/chat.css\">\n"
    js_tag = "    <script src=\"src/scripts/chat.js\"></script>\n"
    
    count = 0
    for file_path in html_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            modified = False
            
            # Check if chat is already present, but continue to verify Font Awesome
            check_chat = 'src/scripts/chat.js' in content
            
            # Inject Font Awesome if missing
            font_awesome = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />\n'
            if 'font-awesome' not in content and '<head>' in content:
                # Insert after <head>
                content = content.replace('<head>', '<head>\n    ' + font_awesome)
                modified = True
            
            if check_chat and not modified:
                print(f"Skipping {os.path.basename(file_path)} - already has chat and font awesome")
                continue
                
            # Inject CSS before </head>
            font_awesome = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />\n'
            if 'font-awesome' not in content and '<head>' in content:
                # Insert after <head>
                content = content.replace('<head>', '<head>\n    ' + font_awesome)
                modified = True
                
            # Inject CSS before </head>
            if 'src/styles/chat.css' not in content and '</head>' in content:
                content = content.replace('</head>', css_tag + '</head>')
                modified = True
                
            # Inject JS before </body>
            if 'src/scripts/chat.js' not in content and '</body>' in content:
                content = content.replace('</body>', js_tag + '</body>')
                modified = True
            
            if modified:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {os.path.basename(file_path)}")
                count += 1
            else:
                print(f"Skipping {os.path.basename(file_path)} - no head/body tags found?")
                
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    print(f"\nDone. Updated {count} files.")

if __name__ == "__main__":
    deploy_chat_widget()
