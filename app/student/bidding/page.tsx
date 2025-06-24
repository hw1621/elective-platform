'use client';

import { useEffect, useState } from 'react';
import { SettingKeys } from '@/types/program_settings_mappings';
import { SelectionStatus } from '@/types/selection_status_enum';
import { BidModule } from '@/types/student_module_selection_types';
import { fetchWithCheck } from '@/utils/fetchWithCheck';
import { Box, Button, Container, Typography, Alert, LinearProgress, Snackbar } from '@mui/material';

import toast from 'react-hot-toast';
import { RegisterLevel } from '@prisma/client';
import { BidResult } from '@/types/bid_result_enum';

export default function AllocateBids() {
  const [programId, setProgramId] = useState<number | null>(null);
  const [settings, setSettings] = useState<Record<string, { id: number; value: string }>>({});

  const [bids, setBids] = useState<Record<number, number>>({});
  const [bidsLeft, setBidsLeft] = useState<number | null>(null);
  const [selectedModules, setSelectedModules] = useState<BidModule[]>([]);
  const [selectionStatus, setSelectionStatus] = useState<SelectionStatus | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);


  useEffect(() => {
    fetch('/api/module_selection_result/by_student')
      .then((res) => res.json())
      .then((body) => {
        if (body.success) {
          setSelectedModules(body.data.selectedModules);
          setProgramId(body.data.programId);
          const initialBids = Object.fromEntries(
            body.data.selectedModules.map((mod: BidModule) => [mod.id, mod.bid_points || 0])
          );
          setBids(initialBids);
          setSelectionStatus(body.data.selectionStatus);
        }
      });
  }, []);

  useEffect(() => {
    if (!programId) return;
    const fetchSettings = async () => {
      try {
        const data = await fetchWithCheck<Array<{ id: number; key: string; value: string }>>(
          `/api/settings?program_id=${programId}`
        );
        const settingsObj = Object.fromEntries(
          data.map((setting) => [setting.key, { id: setting.id, value: setting.value }])
        );
        setSettings(settingsObj);
      } catch (error) {
        toast.error(`Error fetching program settings, error: ${(error as Error).message}`);
      }
    };
    fetchSettings();
  }, [programId]);

  useEffect(() => {
    const totalEctsStr = settings[SettingKeys.TOTAL_ECTS]?.value;
    if (!totalEctsStr) return;

    const totalEcts = Number(totalEctsStr);
    if (isNaN(totalEcts)) return;

    const totalPoints = totalEcts * 10;
    const allocated = Object.values(bids).reduce((sum, p) => sum + p, 0);
    setBidsLeft(totalPoints - allocated);
  }, [bids, settings]);

  const isReadOnly =
    selectionStatus === SelectionStatus.NOT_STARTED ||
    selectionStatus === SelectionStatus.IN_PROGRESS;

  const handleBidChange = (moduleId: number, value: number) => {
    if (isReadOnly) return;

    const safeValue = Math.max(0, Math.floor(value));
    const currentBid = bids[moduleId] || 0;
    const maxAllowed = currentBid + (bidsLeft ?? 0);
    const clampedValue = Math.min(safeValue, maxAllowed);

    setBids(prev => ({ ...prev, [moduleId]: clampedValue }));
  };

  const formatDate = (str?: string) => {
    if (!str) return 'N/A';
    return new Date(str).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSaveBids = async () => {
    try {
      const res = await fetch('/api/module_selection_result/update_bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bids }),
      });
      const data = await res.json();
  
      if (!data.success) {
        setSnackbarSeverity('error');
        setSnackbarMessage('Failed to save bids: ' + data.message);
      } else {
        setSnackbarSeverity('success');
        setSnackbarMessage('Bids saved successfully!');
      }
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Error occurred while saving: ' + (error as Error).message);
    }
    setSnackbarOpen(true);
  }

  const firstRoundStart = formatDate(settings[SettingKeys.FIRST_ROUND_START_DATE]?.value);
  const firstRoundEnd = formatDate(settings[SettingKeys.FIRST_ROUND_END_DATE]?.value);
  const secondRoundStart = formatDate(settings[SettingKeys.SECOND_ROUND_START_DATE]?.value);
  const secondRoundEnd = formatDate(settings[SettingKeys.SECOND_ROUND_END_DATE]?.value);

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Allocate Your Bids
        </Typography>
  
        {isReadOnly && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You cannot allocate bids until you have completed module selection.
          </Alert>
        )}
  
        {bidsLeft !== null && (
          <Box
            sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            mb: 4,
            }}
          >
            {/* Bids Left */}
            <Typography variant="h3" fontWeight="bold" color="primary">
              Bids Left: {bidsLeft}
            </Typography>

            {/* Round date */}
            <Box>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
                1st Round credit registration period:{' '}
                <Typography component="span" variant="body1" fontStyle="italic" fontWeight="normal">
                {firstRoundStart} – {firstRoundEnd}
                </Typography>
            </Typography>

            <Typography variant="body1" fontWeight="bold">
                2nd Round credit registration period:{' '}
                <Typography component="span" variant="body1" fontStyle="italic" fontWeight="normal">
                {secondRoundStart} – {secondRoundEnd}
                </Typography>
            </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 4, mb: 6 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Bidding Notes:
          </Typography>
          <ul style={{ marginLeft: 20 }}>
            <li>1. Each ECTS gives you 100 bid points. You can allocate these across your electives.</li>
            <li>2. You may bid on as many electives as you like, as long as your ECTS and programme rules are satisfied.</li>
            <li>3. If a class is oversubscribed, bids are ranked. The lowest successful bid sets the clearing price.</li>
            <li>4. If you bid more than the clearing price, the difference is refunded.</li>
            <li>5. If a class is undersubscribed, only 1 point is charged. The rest is refunded.</li>
            <li>6. Unsuccessful bids will place you on a waitlist, ordered by points bid, then lottery tie-break.</li>
            <li>7. In Round 2, only classes with available seats are open for new bids.</li>
            <li>8. You cannot bid on full classes or join waitlists in Round 2.</li>
          </ul>
        </Box>
  
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Register modules section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Credit Modules (Biddable)
              </Typography>

          {selectedModules.filter(mod => mod.register_level === RegisterLevel.CREDIT).map((mod) => {
            const bid = bids[mod.id] || 0;
            const maxBid = Math.max(...Object.values(bids), 1);
            const isEditable = mod.bid_result === BidResult.PENDING

            return (
              <Box
                key={mod.id}
                sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid #ccc',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                backgroundColor: '#fff',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography fontSize="1.1rem" fontWeight="600">
                      {mod.code} - {mod.name}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => handleBidChange(mod.id, bid - 1)}
                      disabled={isReadOnly || bid === 0 || !isEditable}
                      sx={{ minWidth: 36, height: 36 }}
                      >
                        <Box component="span" sx={{ fontSize: '1.4rem', lineHeight: 1 }}>−</Box>
                    </Button>

                    <input
                      type="number"
                      value={bid}
                      onChange={(e) => handleBidChange(mod.id, Number(e.target.value))}
                      disabled={isReadOnly || !isEditable}
                      max={bids[mod.id] + (bidsLeft ?? 0)}
                      className="no-spinner"
                      style={{
                          width: '70px',
                          height: '36px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          border: '1px solid #ccc',
                          borderRadius: '6px',
                          padding: '4px 8px',
                      }}
                    />

                    <Button
                      variant="outlined"
                      onClick={() => handleBidChange(mod.id, bid + 1)}
                      disabled={isReadOnly || (bidsLeft !== null && bidsLeft <= 0) || !isEditable}
                      sx={{ minWidth: 36, height: 36 }}
                      >
                        <Box component="span" sx={{ fontSize: '1.4rem', lineHeight: 1 }}>+</Box>
                    </Button>
                  </Box>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={(bid / maxBid) * 100}
                  sx={{
                      height: 8,
                      borderRadius: 5,
                      mt: 2,
                      backgroundColor: '#eee',
                      '& .MuiLinearProgress-bar': {
                      backgroundColor: '#1976d2',
                      },
                  }}
                />
              </Box>
            );
          })}
          </Box>

          {/* Sit-in modules section */}
          {selectedModules.some(mod => mod.register_level === RegisterLevel.SITIN) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
              Sit-in Modules (Non-Biddable)
              </Typography>

              {selectedModules.filter(mod => mod.register_level === RegisterLevel.SITIN).map((mod) => (
              <Box
                  key={mod.id}
                  sx={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px dashed #bbb',
                  backgroundColor: '#f5f5f5',
                  }}
              >
                  <Typography fontSize="1.1rem" fontWeight="500">
                  {mod.code} - {mod.name}
                  </Typography>
              </Box>
              ))}
            </Box>
          )}
        </Box>
      </Container>

      {!isReadOnly && (
        <Box sx={{ mt: 6, textAlign: 'center'}}>
          <Button
            variant='contained'
            color='primary'
            size='large'
            onClick={handleSaveBids}
          >
            Save Bids
          </Button>

        </Box>
      )}

      <Snackbar
        open={snackbarOpen && !!snackbarMessage}
        autoHideDuration={4000}
        onClose={() => {
          setSnackbarOpen(false);
          setSnackbarMessage(null);
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => {
            setSnackbarOpen(false);
            setSnackbarMessage(null);
          }}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </Box>
  );
  
}
