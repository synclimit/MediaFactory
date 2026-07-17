fetch('http://localhost:5178/api/m2/dialog/folder', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log('Success:', data))
  .catch(err => console.error('Fetch Error:', err));
