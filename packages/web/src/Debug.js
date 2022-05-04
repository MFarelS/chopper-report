import { Form } from 'react-bootstrap';

function Debug({ api, options, setOption }) {

  return (
    <div className="debug-panel">
      <Form.Switch label="Show state info" control={<div
        checked={options.showStateInfo}
        inputProps={{ 'aria-label': 'controlled' }}
        onChange={(event) => setOption('showStateInfo', event.target.checked)} />} />
      <Form.Switch label="Show radius" control={<div
        checked={options.showRadius}
        inputProps={{ 'aria-label': 'controlled' }}
        onChange={(event) => setOption('showRadius', event.target.checked)} />} />
      <Form.Switch label="Show history" control={<div
        checked={options.showHistory}
        inputProps={{ 'aria-label': 'controlled' }}
        onChange={(event) => setOption('showHistory', event.target.checked)} />} />
    </div>
  );
}

export default Debug;
