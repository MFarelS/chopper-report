import { useState } from 'react';

import Stack from 'react-bootstrap/Stack'
import Toast from 'react-bootstrap/Toast'
import Modal from 'react-bootstrap/Modal'

import { IoAlertCircleOutline as AlertIcon } from "react-icons/io5";

import FAAReport from './FAAReport';

function Actions({ api, aircrafts, selectedIcao24 }) {

  const [hideFAA, setHideFAA] = useState({})
  const [showFAAModal, setShowFAAModal] = useState(false);

  return (
    <>
      <Stack className="mt-4">
        <Toast bg="dark" className="ms-auto" style={{ maxWidth: '90%' }} onClose={() => setHideFAA(value => ({ ...value, [selectedIcao24]: true }))} show={hideFAA[selectedIcao24] !== true}>
          <Toast.Header className="bg-dark" closeVariant="white">
            <AlertIcon className="me-2 fs-5" />
            <strong className="me-auto">Report to FAA</strong>
          </Toast.Header>
          <Toast.Body className="text-light" style={{ cursor: 'pointer' }} onClick={() => setShowFAAModal(true)}>
            Click here to submit a noise complaint to the FAA for {aircrafts[selectedIcao24].state.callsign}.
          </Toast.Body>
        </Toast>
      </Stack>
      <Modal size="lg" contentClassName="bg-dark" show={showFAAModal} onHide={() => setShowFAAModal(false)}>
        <Modal.Header closeButton closeVariant="white" className="border-dark text-light">
          <Modal.Title>Report to FAA</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FAAReport api={api} icao24={selectedIcao24} aircraft={aircrafts[selectedIcao24]} />
        </Modal.Body>
      </Modal>
    </>
  );
}

export default Actions;
