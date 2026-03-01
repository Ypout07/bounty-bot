import os

def search_in_files(directory, search_term):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if search_term in content:
                        print(f"Found '{search_term}' in {path}")

search_in_files('company-private-repo/src', 'ideal')
search_in_files('company-private-repo/src', 'velocity')
search_in_files('company-private-repo/src', 'user_map')
