"use client"

import { useEffect, useState } from "react";
import { Snackbar, Alert, Checkbox, Button, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, Tabs, Tab, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SchoolIcon from '@mui/icons-material/School';
import { RouteData, Module, StudentInfo, Rule } from "@/types/student_module_selection_types";
import { fetchWithCheck } from "@/utils/fetchWithCheck";
import { SettingKeys } from "@/types/program_settings_mappings";
import React from "react";
import { RegisterLevel } from "@/types/register_level_enum";
import { SelectionStatus } from "@/types/selection_status_enum";
import { signOut } from "next-auth/react";
import { BidResult } from "@/types/bid_result_enum";
import { BidRound } from "@/types/bid_round_enum";
import { getCurrentBidRound } from "@/utils/calculateBidRound";

export default function Modules( ) {
    const [programId, setProgramId] = useState<number | null>(null);
    const [programName, setProgramName] = useState<string | null>(null);
    const [academicYearName, setAcademicYearName] = useState<string | null>(null);
    const [academicYearId, setAcademicYearId] = useState<number | null>(null);
    const [routes, setRoutes] = useState<{ id: number; name: string }[]>([]);
    const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
    const [routeData, setRouteData] = useState<RouteData | null>(null);
    const [settings, setSettings] = useState<Record<string, { id: number; value: string }>>({});

    const [currentBidRound, setCurrentBidRound] = useState<BidRound>(BidRound.NOT_STARTED);
    //The map of bidding allocation result
    const [bidResultMap, setBidResultMap] = useState<Record<number, { result: string; rank?: number }>>({});

    //Initial module selection state and final module selection state
    const [selectedModules, setSelectedModules] = useState<number[]>([]);
    const [sitInModules, setSitInModules] = useState<number[]>([]);
    const [initialSelectedModules, setInitialSelectedModules] = useState<number[]>([]);
    const [initialSitInModules, setInitialSitInModules] = useState<number[]>([]);

    const [openModuleDialog, setOpenModuleDialog] = useState<boolean>(false);
    const [dialogModule, setDialogModule] = useState<Module | null>(null);
    const [selectionStatus, setSelectionStatus] = useState<SelectionStatus | null>(null);

    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
    const [confirmDropOpen, setConfirmDropOpen] = useState(false);
    const [modulesToDrop, setModulesToDrop] = useState<number[]>([]);
     
    //Find signed in user information
    useEffect(() => {
      fetch('/api/login')
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data) {
            setProgramId(res.data.program_id)
            setAcademicYearId(res.data.academic_year_id)
            setProgramName(res.data.program.title)
            setAcademicYearName(res.data.academic_year.name)
            setSelectionStatus(res.data.selection_status)
            setSelectedRouteId(res.data.route_id)
            setStudentInfo({
              user_name: res.data.user_name,
              given_name: res.data.given_name,
              surname: res.data.surname,
              cid: res.data.cid,
              email: res.data.email,
            });
            
          }
        })
    }, [])

    // fallback: if haven't selected route_id, then automatically chosing first route
    useEffect(() => {
      if (!selectedRouteId && routes.length > 0) {
        setSelectedRouteId(routes[0].id);
      }
    }, [routes, selectedRouteId]);
    
    //Find routes of enrolled program
    useEffect(() => {
        if (programId) {
            fetch(`/api/routes?program_id=${programId}`)
                .then(res => res.json())
                .then(res => {
                    if (res.success) setRoutes(res.data)
                })
        }
    }, [programId])

    //Find the module selection data and previous student selectio results after selecting route id  
    useEffect(() => {
      if (!selectedRouteId) return;
  
      const loadData = async () => {
        const res = await fetch(`/api/modules/selection?route_id=${selectedRouteId}`);
        const body = await res.json();
        if (!body.success) {
          alert("Failed to fetch module groups and selections");
          return;
        }
        const routeData = body.data;
        setRouteData(routeData);
  
        const allModuleIds = routeData.rules.flatMap((rule: Rule) => rule.modules.map(m => m.id));
        const compulsoryIds = routeData.rules
          .filter((rule: Rule) => rule.is_compulsory)
          .flatMap((rule: Rule) => rule.modules.map(m => m.id));
  
        //Fetch previous selection result
        const selRes = await fetch(`/api/module_selection_result`);
        const selBody = await selRes.json();

        if (selBody.success && selBody.data?.records) {
          const bidMap: Record<number, { result: string; rank?: number }> = {};
          selBody.data.records.forEach((r: { module_id: number; bid_result: string | null; rank?: number }) => {
            if (r.bid_result) {
              bidMap[r.module_id] = {
                result: r.bid_result,
                rank: r.rank,
              }
            }
          });
          setBidResultMap(bidMap);
        }
        
        if (selBody.success && selBody.data?.selections_by_type && selBody.data.route_id === selectedRouteId) {
          //Student has made selections before
          const selectedRaw = selBody.data.selections_by_type[RegisterLevel.CREDIT] || [];
          const sitInRaw = selBody.data.selections_by_type[RegisterLevel.SITIN] || [];
  
          const selectedCleaned = Array.from(new Set([
            ...selectedRaw.filter((id: number) => allModuleIds.includes(id)),
            ...compulsoryIds,
          ]));
          const sitInCleaned = sitInRaw.filter((id: number) => allModuleIds.includes(id));
  
          setSelectedModules(selectedCleaned);
          setSitInModules(sitInCleaned);
          setInitialSelectedModules(selectedCleaned);
          setInitialSitInModules(sitInCleaned);
        } else {
          //Student hasn't made any selections before
          setSelectedModules(compulsoryIds);
          setSitInModules([]);
          setInitialSelectedModules([]);
          setInitialSitInModules([]);
        }
      };
  
      loadData();
    }, [selectedRouteId]);
        
    //Find the settings of the program
    useEffect(() => {
      if (programId) {
        const fetchSettings = async () => {
          try {
              const data = await fetchWithCheck<Array<{ id: number; key: string; value: string }>>(`/api/settings?program_id=${programId}`);
              const settings = Object.fromEntries(
                  data.map((setting) => [
                      setting.key,
                      { id: setting.id, value: setting.value }
                  ])
              );

              setSettings(settings);
              setCurrentBidRound(getCurrentBidRound(settings))
          } catch (error) {
            console.log(error)
            alert("Error fetching program settings")
          };
        }
        fetchSettings();
      }
  }, [programId]);
    
    const handleToggleModule = (moduleId: number) => {
      if (currentBidRound === BidRound.NOT_STARTED) {
        setSnackbarMessage("Bidding has not started yet.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      if (selectedModules.includes(moduleId)) {
        setSelectedModules(prev => prev.filter(id => id !== moduleId));
      } else {
        setSelectedModules(prev => [...prev, moduleId]);
        setSitInModules(prev => prev.filter(id => id !== moduleId));
      }
    };

    const computeInsertAndRemoveModules = () => {
      const compulsoryIds = routeData?.rules
        .filter((rule: Rule) => rule.is_compulsory)
        .flatMap((rule: Rule) => rule.modules.map(m => m.id));

      const addedCredit = selectedModules.
        filter(id => !initialSelectedModules.includes(id))
        .map(id => ({ 
          module_id: id, 
          register_level: RegisterLevel.CREDIT, 
          is_compulsory: compulsoryIds?.includes(id) 
        }));
      const removedCredit = initialSelectedModules.filter(id => !selectedModules.includes(id));
      const addedSitIn = sitInModules.filter(id => !initialSitInModules.includes(id)).map(id => ({ module_id: id, register_level: RegisterLevel.SITIN }));
      const removedSitIn = initialSitInModules.filter(id => !sitInModules.includes(id));

      return { added: [...addedCredit, ...addedSitIn], removed: [...removedCredit, ...removedSitIn] };
    }    

    const handleToggleSitIn = (moduleId: number) => {
      if (currentBidRound === BidRound.NOT_STARTED) {
        setSnackbarMessage("Bidding has not started yet.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      if (sitInModules.includes(moduleId)) {
        setSitInModules(prev => prev.filter(id => id !== moduleId));
      } else {
        setSitInModules(prev => [...prev, moduleId]);
        setSelectedModules(prev => prev.filter(id => id !== moduleId));
      }
    };

    const calculateGroupECTS = (modules: Module[]) => {
      const filtered = modules.filter((module) => 
        selectedModules.includes(module.id) &&
        !(bidResultMap[module.id]?.result === BidResult.WAITLIST)
    );
      if (!filtered.length) return '0.0';
      const total = filtered.reduce((sum, m) => sum + (Number(m.ects) || 0), 0);
      return total.toFixed(1);
    };

    const handleSubmit = async (needCheck: boolean = true) => {
      if (!programId || !academicYearId || !selectedRouteId) return;
  
      const validation = validateSelections();
      if (!validation.valid) {
        alert(validation.message);
        return;
      }
  
      const { added, removed } = computeInsertAndRemoveModules();

      //Check whether the dropped credit modules have been already bidded  
      if (needCheck) {
        const droppedSuccessModules = removed.filter((id) => {
          const bid = bidResultMap[id];
          return bid && bid.result === BidResult.SUCCESS;
        });
        if (droppedSuccessModules.length > 0) {
          setModulesToDrop(droppedSuccessModules)
          setConfirmDropOpen(true);
          return
        }
      }

      const payload = {
        status: SelectionStatus.COMPLETE,
        academic_year_id: academicYearId,
        route_id: selectedRouteId,
        added,
        removed,
        bid_round: currentBidRound,
      }
  
      try {
        const res = await fetch("/api/module_selection_result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
  
        const data = await res.json();
        if (!data.success) {
          alert("Fail to update module selections: " + data.message);
        } else {
          setSelectionStatus(SelectionStatus.COMPLETE)
          setSnackbarMessage("Final selections submitted successfully.");
          setSnackbarSeverity('success')
          setSnackbarOpen(true);
        }
      } catch (error) {
        alert("Failed to submit module selections: " + (error as Error).message);
      }
    };

    const handleTemperorySave = async() => {
      if (!programId || !academicYearId || !selectedRouteId) {
        return;
      }

      const { added, removed } = computeInsertAndRemoveModules();
      const payload = {
        status: SelectionStatus.IN_PROGRESS,
        academic_year_id: academicYearId,
        route_id: selectedRouteId,
        added,
        removed,
        bid_round: currentBidRound,
      };

      try {
        const res = await fetch("/api/module_selection_result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: SelectionStatus.IN_PROGRESS,
            academic_year_id: academicYearId,
            route_id: selectedRouteId,
            payload,
          }),
        });
  
        const data = await res.json();
        if (!data.success) {
          alert("Fail to update module selections: " + data.message);
        } 
        setSelectionStatus(SelectionStatus.IN_PROGRESS)
      } catch (error) {
        alert("Failed to save module selections: " + (error as Error).message);
      }
    }

    const validateSelections = (): { valid: boolean; message?: string } => {
      if (!routeData?.rules) return { valid: true};

      for (const rule of routeData.rules) {
        if (rule.is_compulsory) continue
        const selected = rule.modules.filter(m => 
          selectedModules.includes(m.id) && 
          bidResultMap[m.id]?.result !== BidResult.WAITLIST
        )
        const total = selected.reduce((sum, m) => sum + (Number(m.ects) || 0), 0);
        const min = rule.min_ects ?? 0;
        const max = rule.max_ects ?? Infinity;

        if (total < min || total > max) {
          return {
            valid: false, 
            message: `Module group ${rule.module_group_name} requires ${min} - ${max} ECTs. Currently selected ${total}`
          }
        }
      }

      return { valid: true }
    }

    const formatDate = (str?: string) => {
      if (!str) return 'N/A';
      return new Date(str).toLocaleDateString('en-GB', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
    };

    const allowSitIn = settings[SettingKeys.ENABLE_SIT_IN]?.value === 'true'
    const firstRoundStart = settings[SettingKeys.FIRST_ROUND_START_DATE]?.value 
    const firstRoundEnd = settings[SettingKeys.FIRST_ROUND_END_DATE]?.value
    const secondRoundStart = settings[SettingKeys.SECOND_ROUND_START_DATE]?.value
    const secondRoundEnd = settings[SettingKeys.SECOND_ROUND_END_DATE]?.value
    
    return (
      <Box sx={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 2}}>
            <Typography variant="h4" fontWeight="bold">
              {programName}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Module Selection {academicYearName}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 4,
              mb: 4,
            }}
          >
            <Box>
              {firstRoundEnd && firstRoundStart && (
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  1st Round credit registration period:
                  <span style={{ fontStyle: 'italic', fontWeight: 400, marginLeft: 4 }}>
                    {formatDate(firstRoundStart)} – {formatDate(firstRoundEnd)}
                  </span>
                </Typography>
              )}

              {secondRoundStart && secondRoundEnd && (
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  2nd Round credit registration period:
                  <span style={{ fontStyle: 'italic', fontWeight: 400, marginLeft: 4 }}>
                    {formatDate(secondRoundStart)} – {formatDate(secondRoundEnd)}
                  </span>
                </Typography>                
              )}

              <Typography variant="body1">
                <strong>Note:</strong><br />
                1. Please select your intended route before making any module selections.<br />
                2. Changing your route will clear any previously selected modules.<br />
                3. You can only submit selections for one route — submitting a new route will overwrite your previous submission.<br />
              </Typography>
            </Box>

            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Typography variant="h6" fontWeight="bold" align="right" gutterBottom>
                User Identity
              </Typography>

              {[
                { label: "Name:", value: `${studentInfo?.surname} ${studentInfo?.given_name} (${studentInfo?.user_name})`, showSignOut: true },
                { label: "Email:", value: studentInfo?.email },
                { label: "Degree:", value: programName },
                { label: "CID:", value: `${studentInfo?.cid}` },
              ].map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    // fontFamily: "monospace",
                    fontSize: "1rem",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <Box sx={{ minWidth: 150, fontWeight: "bold", textAlign: "right", pr: 1 }}>
                    {item.label}
                  </Box>
                  <Box sx={{ textAlign: "left", display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{item.value}</span>
                    {item.showSignOut && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'error.main',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontWeight: 500,
                          alignItems: 'right',
                          ml: 1,
                          '&:hover': { opacity: 0.8 },
                        }}
                        onClick={() => signOut({ callbackUrl: '/sign-in' })}
                      >
                        Sign out
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {selectionStatus && (
            <Box sx={{ my: 2 }}>
              {selectionStatus === SelectionStatus.COMPLETE ? (
                <Alert severity="success">
                  🎉 You have successfully completed your module selection.
                </Alert>
              ) : (
                <Alert severity="warning">
                  ⏳ Your have not completed your module selection. Please review and submit when ready.
                </Alert>
              )}
            </Box>
          )}

          <Box sx={{ borderBottom: 2, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={selectedRouteId || false}
              onChange={(_, newValue) => {
                setSelectedRouteId(newValue)
              }}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="route tabs"
            >
              {routes.map((route) => (
                <Tab key={route.id} label={route.name} value={route.id} sx={{ color: 'text.primary', fontWeight: 600 }} />
              ))}
            </Tabs>
          </Box>
    
          <TableContainer component={Paper} sx={{ mb: 2, width: '100%', overflow: 'auto', borderRadius: 2, border: '1px solid', borderColor: '#94a3b8' }}>
            <Table size="small">

              <TableHead sx={{ backgroundColor: '#f0f4f8' }}>
                <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                  <TableCell rowSpan={2} sx={{ fontWeight: 'bold' }}>Group</TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 'bold' }}>Code</TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 'bold' }}>Bid Result</TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 'bold' }}>Term</TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 'bold' }}>Credits</TableCell>
                  <TableCell colSpan={allowSitIn ? 2 : 1} align="center" sx={{ fontWeight: 'bold', borderBottom: '2px solid' }}>Subscription Level</TableCell>
                </TableRow>
                <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                  {allowSitIn && <TableCell sx={{ fontWeight: 'bold' }}>Sit-in</TableCell>}
                  <TableCell sx={{ fontWeight: 'bold' }}>Register</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {routeData?.rules?.map((rule) => (
                  <React.Fragment key={rule.module_group_id}>
                    {rule.modules.map((module, idx) => {
                      const isSelected = selectedModules.includes(module.id);
                      const highlightStyle = isSelected
                        ? { backgroundColor: '#e3f2fd' }
                        : {};

                      return (
                        <TableRow key={module.id}>
                          {idx === 0 && (
                            <TableCell
                              rowSpan={rule.modules.length}
                              sx={{ verticalAlign: 'middle', fontWeight: 700, backgroundColor: '#f0f4f8', border: '1px solid #94a3b8' }}
                            >
                              {rule.module_group_name}
                            </TableCell>
                          )}
                          <TableCell sx={highlightStyle}>{module.code}</TableCell>
                          <TableCell sx={highlightStyle}>
                            <Button
                              variant="text"
                              sx={{ p: 0, minWidth: 0, textTransform: 'none', textDecoration: 'underline', color: 'primary.dark' }}
                              onClick={() => { setDialogModule(module); setOpenModuleDialog(true)}}
                            >
                              {module.title}
                            </Button>
                          </TableCell>
                          <TableCell sx={highlightStyle}>
                            {bidResultMap[module.id] ? (
                              <Box
                                sx={{
                                  display: 'inline-block',
                                  textAlign: 'center',
                                  minWidth: 90,
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  color: 'white',
                                  backgroundColor:
                                    bidResultMap[module.id].result === BidResult.SUCCESS
                                      ? '#2e7d32' // green
                                      : bidResultMap[module.id].result === BidResult.WAITLIST
                                      ? '#f9a825' // amber
                                      : bidResultMap[module.id].result === BidResult.DROP
                                      ? '#c62828' // red
                                      : '#9e9e9e', // grey default
                                }}
                              >
                                {bidResultMap[module.id].result}
                                {bidResultMap[module.id].result === BidResult.WAITLIST &&
                                  typeof bidResultMap[module.id].rank === 'number' &&
                                  `: ${bidResultMap[module.id].rank}`}
                              </Box>
                            ) : (
                              ''
                            )}
                          </TableCell>
                          <TableCell sx={highlightStyle}>{module.term}</TableCell>
                          <TableCell sx={{ ...highlightStyle }} align="left">
                            {module.ects ?? 'N/A'} ECTS
                          </TableCell>

                          {allowSitIn && (
                            <TableCell sx={highlightStyle}>
                              <Checkbox
                                checked={sitInModules.includes(module.id)}
                                onChange={() => handleToggleSitIn(module.id)}
                                disabled={!module.allow_sit_in || rule.is_compulsory}
                              />
                            </TableCell>
                          )}
                          <TableCell sx={highlightStyle}>
                            <Checkbox
                              checked={selectedModules.includes(module.id)}
                              onChange={() => handleToggleModule(module.id)}
                              disabled={rule.is_compulsory}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Summary Row & Spacing */}
                    <TableRow>
                      <TableCell
                        colSpan={allowSitIn ? 7 : 6}
                        align="right"
                        sx={{ borderBottom: 'none', py: 2, fontSize: '0.9rem', backgroundColor: 'white' }}
                      >
                        <Box>
                          <Typography component="span" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                            Selected: {calculateGroupECTS(rule.modules)} ECTS
                          </Typography>
                          <Typography component="span" sx={{ ml: 3, fontWeight: 'bold' }}>
                            Required: {rule.min_ects ?? 0}–{rule.max_ects ?? '∞'} ECTS
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={allowSitIn ? 7 : 6} sx={{ height: 12 }} />
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>

            </Table>
          </TableContainer>
    
          {routeData && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button variant="outlined" onClick={handleTemperorySave}>Save</Button>
              <Button variant="contained" color="success" onClick={() => handleSubmit()}>Submit</Button>
            </Box>
          )}

          <Snackbar
            open={snackbarOpen && !!snackbarMessage}
            autoHideDuration={3000}
            onClose={() => {
              setSnackbarOpen(false);
              setSnackbarMessage(null);
            }}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={() => {
                setSnackbarOpen(false);
                setSnackbarMessage(null);
              }}
              severity={snackbarSeverity}
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
          

          <Dialog open={openModuleDialog} onClose={() => { setOpenModuleDialog(false); setDialogModule(null); }} fullWidth maxWidth="md">
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                backgroundColor: '#1976d2',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px',
              }}
            >
              <SchoolIcon />
              {dialogModule?.title}
            </DialogTitle>

            <DialogContent
              dividers
              sx={{
                maxHeight: '70vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {[
                { title: 'Module Content', content: dialogModule?.module_content },
                { title: 'Learning Outcome', content: dialogModule?.learning_outcome },
                { title: 'Learn Teach Approach', content: dialogModule?.learn_teach_approach },
                { title: 'Assessment', content: dialogModule?.assessment },
                { title: 'Reading List', content: dialogModule?.reading_list },
              ].map(({ title, content }) => (
                <Box
                  key={title}
                  sx={{
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    backgroundColor: '#fafafa',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      borderLeft: '4px solid #1976d2',
                      pl: 1.5,
                      mb: 1,
                      py: 0.5,
                      backgroundColor: '#e3f2fd',
                      borderRadius: 1,
                    }}
                  >
                    <InfoOutlinedIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '1.05rem',
                        color: 'primary.dark',
                      }}
                    >
                      {title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.primary' }}>
                    {content || 'None'}
                  </Typography>
                </Box>
              ))}
            </DialogContent>

            <DialogActions>
              <Button onClick={() => { setOpenModuleDialog(false); setDialogModule(null); }}>
                Close
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={confirmDropOpen} onClose={() => { setConfirmDropOpen(false) }}>
            <DialogTitle>Confirm Module Drop</DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 1 }}>
                You are about to drop the following module(s) you have already been allocated a place in:
              </Typography>
  
              <Box component="ul" sx={{ pl: 3, mb: 2, listStyle: 'disc', listStylePosition: 'inside' }}>
                {modulesToDrop.map(id => {
                  const mod = routeData?.rules.flatMap(r => r.modules).find(m => m.id === id);
                  return (
                    <li key={id}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {mod?.title ?? `Module ${id}`}
                      </Typography>
                    </li>
                  );
                })}
              </Box>

              <Typography color="error" sx={{ fontStyle: 'italic' }}>
                Note!! This operation <strong>cannot</strong> be undone and you will give up your place
              </Typography>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setConfirmDropOpen(false)}>Cancel</Button>
              <Button
                color="error"
                variant="contained"
                onClick={async () => {
                  setConfirmDropOpen(false);
                  await handleSubmit(false);
                }}
              >
                Confirm Drop
              </Button>
            </DialogActions>
            
          </Dialog>
        </Container>
      </Box>
    );

}

