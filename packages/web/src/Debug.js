import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

function Debug({ api, options, setOption }) {

  return (
    <div className="debug-panel">
      <FormControlLabel label="Show state info" control={<Checkbox
        checked={options.showStateInfo}
        inputProps={{ 'aria-label': 'controlled' }}
        onChange={(event) => setOption('showStateInfo', event.target.checked)} />} />
      <FormControlLabel label="Show radius" control={<Checkbox
        checked={options.showRadius}
        inputProps={{ 'aria-label': 'controlled' }}
        onChange={(event) => setOption('showRadius', event.target.checked)} />} />
      <FormControlLabel label="Show history" control={<Checkbox
        checked={options.showHistory}
        inputProps={{ 'aria-label': 'controlled' }}
        onChange={(event) => setOption('showHistory', event.target.checked)} />} />
    </div>
  );
}

export default Debug;
