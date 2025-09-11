import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

import StyledButton from '../Button';
import StyledDialogTitle from '../DialogTitle';
import SelectTrain from './SelectTrain';
import SelectRoute from './SelectRoute';
import {
  showAlert,
  requestTrain,
  isLoadingTrainRequest,
} from '../../pages/train-requester/trainsSlice';

const TrainRequestModal = ({ open, handleClose }) => {
  const dispatch = useDispatch();
  const loading = useSelector(isLoadingTrainRequest);

  const [train, setTrain] = useState('');
  const [description, setDescription] = useState('');
  const [trainRoutes, setTrainRoutes] = useState([{ name: '', id: '' }]);
  const [rounds, setRounds] = useState(1);

  const handleTrainChange = (newTrain) => {
    setTrain(newTrain ? `${newTrain.name}:${newTrain.tag}` : '');
  };

  const handleChangeRounds = (event) => {
    setRounds(event.target.value);
  };

  const renderRoutes = () => {
    const routes = trainRoutes.map((rt, idx) =>
      idx === trainRoutes.length - 1 ? rt.name : `${rt.name} ⇒ `
    );

    return parseInt(rounds) > 1 ? (
      <>
        ({routes})
        <sup>
          <b>x{rounds}</b>
        </sup>
      </>
    ) : (
      routes
    );
  };

  const handleSubmitTrain = () => {
    if (!train || !description || trainRoutes.some((route) => route.name === '')) {
      alert('Please enter all missing fields!');
    } else {
      let routes =
        rounds > 1
          ? Array(parseInt(rounds)).fill(trainRoutes).flat()
          : trainRoutes;
      routes = routes.map((rt) => rt.id).toString();

      if (routes.length > 255) {
        dispatch(
          showAlert({
            message:
              'Route length exceeded limit VARCHAR(255). Please lower training rounds.',
            options: {
              key: 'routeLengthExceeded',
              variant: 'error',
            },
          })
        );
        return;
      }

      const payload = {
        route: routes,
        trainclassid: train,
        traininstanceid: 1,
        description
      };

      dispatch(requestTrain(payload)).then(() => {
        setTrain('');
        setRounds(1);
        setTrainRoutes([{ name: '', id: '' }]);
      });
    }
  };

  const handleModalClose = () => {
    setTrain('');
    setRounds(1);
    setTrainRoutes([{ name: '', id: '' }]);
    handleClose();
  };

  return (
    <Dialog fullWidth maxWidth="md" open={open}>
      <StyledDialogTitle onClose={handleModalClose} disable={loading}>
        Create Train Request
      </StyledDialogTitle>
      <DialogContent dividers>
        <SelectTrain
          loading={loading}
          selected={train}
          handleTrainChange={handleTrainChange}
        />
        <TextField
          label="Repeat Training Rounds"
          type="number"
          sx={{ mt: 2 }}
          fullWidth
          value={rounds}
          disabled={loading}
          onChange={handleChangeRounds}
          inputProps={{ min: 1 }}
        />
        <TextField
          label="Description"
          multiline
          maxRows={4}
          sx={{ mt: 2 }}
          fullWidth
          disabled={loading}
          value={description}
          placeholder="Description about the Train Request"
          onChange={(e) => setDescription(e.target.value)}
        />
        <SelectRoute
          label="Select Route"
          loading={loading}
          routes={trainRoutes}
          setRoutes={setTrainRoutes}
        />
        <Divider sx={{ my: 2 }} />
        <Typography>
          <b>Train:</b> {!train ? 'Not Selected' : train}
        </Typography>
        <Typography>
          <b>Route:</b> {!trainRoutes[0].name ? 'Not Selected' : renderRoutes()}
        </Typography>
      </DialogContent>
      <DialogActions>
        <StyledButton
          variant="contained"
          onClick={handleSubmitTrain}
          disabled={loading}
        >
          {loading ? <CircularProgress size={25} thickness={5} /> : 'Submit'}
        </StyledButton>
      </DialogActions>
    </Dialog>
  );
};

export default TrainRequestModal;
