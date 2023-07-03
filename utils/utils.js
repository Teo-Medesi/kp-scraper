function transformString(input) {
  let transformed = input.toLowerCase();

  // Replace whitespace with hyphens
  transformed = transformed.replace(/\s+/g, '-');

  // Replace special characters
  const replacements = {
    'đ': 'dj',
    'š': 's',
    'ž': 'z',
    'ć': 'c',
    'č': 'c'
  };

  transformed = transformed.replace(/[đšžćč]/g, match => replacements[match]);

  return transformed;
}

export {
  transformString
}