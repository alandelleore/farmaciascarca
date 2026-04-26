import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Button
} from '@mui/material';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DownloadIcon from '@mui/icons-material/Download';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Farmacia } from './types';

const isNativeApp = () => {
  const userAgent = navigator.userAgent || '';
  return userAgent.includes('wv') || userAgent.includes('WebView');
};

const APK_URL = 'https://farmacias-436a4.web.app/farmacias.apk';

function App() {
  const [farmacia, setFarmacia] = useState<Farmacia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadBtn, setShowDownloadBtn] = useState(true);

  useEffect(() => {
    setShowDownloadBtn(!isNativeApp());
  }, []);

  useEffect(() => {
    const fetchTurnoHoy = async () => {
      try {
        const hoy = new Date();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const anio = hoy.getFullYear();
        const dia = hoy.getDate();
        const mesAnio = `${anio}-${mes}`;

        const turnosSnapshot = await getDocs(collection(db, 'turnos'));
        let nombreFarmacia = '';

        turnosSnapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id === mesAnio && data.dias) {
            nombreFarmacia = data.dias[dia];
          }
        });

        if (nombreFarmacia) {
          const farmaciasSnapshot = await getDocs(collection(db, 'farmacias'));
          farmaciasSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.nombre === nombreFarmacia) {
              setFarmacia({
                id: doc.id,
                nombre: nombreFarmacia,
                telefono: data.telefono || '',
                direccion: data.direccion || ''
              });
            }
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error al cargar los datos');
        setLoading(false);
      }
    };

    fetchTurnoHoy();
  }, []);

  const handleDownload = () => {
    window.location.href = APK_URL;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#006D5C' }}>
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #006D5C 0%, #004D40 100%)',
        py: 4,
        px: 2
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
            Farmacias de Turno
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
            Carcarañá, Santa Fe
          </Typography>
        </Box>

        {farmacia ? (
          <Card sx={{ borderRadius: 4, boxShadow: 6 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box
                  sx={{
                    bgcolor: '#006D5C',
                    borderRadius: '50%',
                    p: 2
                  }}
                >
                  <LocalPharmacyIcon sx={{ fontSize: 60, color: 'white' }} />
                </Box>
              </Box>

              <Typography variant="h5" component="h2" sx={{ textAlign: 'center', mb: 1 }}>
                Farmacia de Turno
              </Typography>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Chip
                  label={new Date().toLocaleDateString('es-AR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  sx={{ bgcolor: '#006D5C', color: 'white' }}
                />
              </Box>

              <Typography variant="h4" component="h3" sx={{ textAlign: 'center', color: '#006D5C', mb: 3 }}>
                {farmacia.nombre}
              </Typography>

              <Stack spacing={2}>
                {farmacia.telefono && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PhoneIcon color="primary" />
                    <Typography variant="body1">{farmacia.telefono}</Typography>
                  </Box>
                )}

                {farmacia.direccion && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocationOnIcon color="primary" />
                    <Typography variant="body1">{farmacia.direccion}</Typography>
                  </Box>
                )}
              </Stack>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Los turnos son de 8:00 a 8:00 hs del día siguiente. Los datos son proporcionados por las farmacias y pueden variar sin previo aviso.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ borderRadius: 4, boxShadow: 6 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <LocalPharmacyIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
              <Typography variant="h5" color="text.secondary">
                No hay farmacia de turno registrada para hoy
              </Typography>
            </CardContent>
          </Card>
        )}

        <Box sx={{ mt: 4 }}>
          {showDownloadBtn && (
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{
                bgcolor: 'white',
                color: '#006D5C',
                fontWeight: 'bold',
                py: 1.5,
                '&:hover': {
                  bgcolor: '#f0f0f0'
                }
              }}
            >
              Descargar App
            </Button>
          )}
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', mt: 4 }}>
          Datos proporcionados por la Municipalidad de Carcarañá
        </Typography>
      </Container>
    </Box>
  );
}

export default App;