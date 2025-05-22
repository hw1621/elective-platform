"use client"

import { useEffect, useState } from "react";
import { Snackbar, Alert, Checkbox, Button, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { RouteData, Module } from "@/types/selection-types";
import { fetchWithCheck } from "@/utils/fetchWithCheck";
import { SettingKeys } from "@/types/settings-keys";
import React from "react";

export default function Modules( ) {
    const [programId, setProgramId] = useState<number | null>(null);
    const [academicYearId, setAcademicYearId] = useState<number | null>(null);
    const [routes, setRoutes] = useState<{ id: number; name: string }[]>([]);
    const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
    const [routeData, setRouteData] = useState<RouteData | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [settings, setSettings] = useState<Record<string, { id: number; value: string }>>({});

    const [selectedModules, setSelectedModules] = useState<number[]>([]);
    const [sitInModules, setSitInModules] = useState<number[]>([]);
     
    //Find signed in user information
    useEffect(() => {
        fetch('/api/login')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    setProgramId(res.data.program_id)
                    setAcademicYearId(res.data.academic_year_id)
                }
            })
    }, [])

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

    //Find the modules given route of the program
    useEffect(() => {
      if (programId && selectedRouteId) {
          fetch(`/api/modules/election?program_id=${programId}&&route_id=${selectedRouteId}`)
            .then(response => response.json())
            .then(response => {
              if (response.success) {
                setRouteData(response.data)
              } else {
                alert(`Failed to fetch modules: ${response.message}`)
              }
            })
      }
    }, [programId, selectedRouteId]);

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
          } catch (error) {
            console.log(error)
            alert("Error fetching program settings")
          };
        }
        fetchSettings();
      }
  }, [programId]);
    
  const handleToggleModule = (moduleId: number) => {
    if (selectedModules.includes(moduleId)) {
      setSelectedModules(prev => prev.filter(id => id !== moduleId));
    } else {
      setSelectedModules(prev => [...prev, moduleId]);
      setSitInModules(prev => prev.filter(id => id !== moduleId));
    }
  };

    const handleToggleSitIn = (moduleId: number) => {
      if (sitInModules.includes(moduleId)) {
        setSitInModules(prev => prev.filter(id => id !== moduleId));
      } else {
        setSitInModules(prev => [...prev, moduleId]);
        setSelectedModules(prev => prev.filter(id => id !== moduleId));
      }
    };

    const calculateGroupECTS = (modules: Module[]) => {
      const filtered = modules.filter((module) => selectedModules.includes(module.id));
      if (!filtered.length) return '0.0';
      const total = filtered.reduce((sum, m) => sum + (Number(m.ects) || 0), 0);
      return total.toFixed(1);
    };

    const allowSitIn = settings[SettingKeys.ENABLE_SIT_IN]?.value === 'true'

    const handleSubmit = async() => {
        // const selections = Object.values(grouped_modules).map((group) => {
        //     const selectedModulesInGroup = group.modules.filter(module => 
        //         selectedModules.includes(module.module.id)
        //     ).map(module => ({
        //         id: module.module.id,
        //         ects: module.module.ects
        //     }))

        //     return {
        //         group_id: group.modules[0].module_group.id,
        //         selected_modules: selectedModulesInGroup
        //     };
        // }).filter(selection => selection.selected_modules.length > 0);

        // try {
        //     const response = await fetch('/api/programs/check', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({
        //             program_id: programId,
        //             academic_year_id: academic_year_id,
        //             selections: selections,
        //         }),
        //     });
        //     const data = await response.json();
        //     console.log(data);
        //     if (!response.ok) {
        //         alert("Module selection is invalid:\n" + data.errors.map((e: {message: string}) => e.message).join("\n"));
        //         return;
        //     }

        //     setSnackbarOpen(true);
        // } catch (error) {
        //     console.error("Error submitting selected modules:", error);
        //     alert("An error occurred while submitting the selected modules, please try later");
        // }
    }

    return (
      <Container>
        <Typography variant="h4" gutterBottom>Select Your Route</Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Route</InputLabel>
          <Select
            value={selectedRouteId || ''}
            onChange={(e) => setSelectedRouteId(Number(e.target.value))}
            disabled={!programId}
          >
            {routes.map(route => (
              <MenuItem key={route.id} value={route.id}>{route.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
  
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">

            <TableHead sx={{ backgroundColor: '#f0f4f8' }}>
              <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                <TableCell rowSpan={2} sx={{ fontWeight: 'bold' }}>Group</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 'bold' }}>Code</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 'bold' }}>Title</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 'bold' }}>Term</TableCell>
                <TableCell rowSpan={2} sx={{ fontWeight: 'bold' }}>Credits</TableCell>
                <TableCell colSpan={allowSitIn ? 2 : 1} align="center" sx={{ fontWeight: 'bold' }}>Subscription Level</TableCell>
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
                            sx={{ verticalAlign: 'middle', fontWeight: 700, backgroundColor: '#f0f4f8' }}
                          >
                            {rule.module_group_name}
                          </TableCell>
                        )}
                        <TableCell sx={highlightStyle}>{module.code}</TableCell>
                        <TableCell sx={highlightStyle}>{module.title}</TableCell>
                        <TableCell sx={highlightStyle}>{module.term}</TableCell>
                        <TableCell sx={{ ...highlightStyle }} align="right">
                          {module.ects ?? 'N/A'} ECTS
                        </TableCell>

                        {allowSitIn && (
                          <TableCell sx={highlightStyle}>
                            <Checkbox
                              checked={sitInModules.includes(module.id)}
                              onChange={() => handleToggleSitIn(module.id)}
                              disabled={!module.allow_sit_in}
                            />
                          </TableCell>
                        )}
                        <TableCell sx={highlightStyle}>
                          <Checkbox
                            checked={selectedModules.includes(module.id)}
                            onChange={() => handleToggleModule(module.id)}
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
                      sx={{ borderBottom: 'none', py: 2, fontSize: '0.9rem', backgroundColor: '#f9f9f9' }}
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
                    <TableCell colSpan={allowSitIn ? 7 : 6} sx={{ height: 12, borderBottom: 'none' }} />
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>

          </Table>
        </TableContainer>
  
        {routeData && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={handleSubmit}>Save</Button>
            <Button variant="contained" color="success" onClick={handleSubmit}>Submit</Button>
          </Box>
        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
            Elective modules saved successfully.
          </Alert>
        </Snackbar>
      </Container>
    );

}

