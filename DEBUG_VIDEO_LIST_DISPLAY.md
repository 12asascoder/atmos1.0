# Debug: Video List Display Issue

## Problem
Generation Progress section only shows "Video 1" and "Video 2" instead of all 5 videos (Video 1, 2, 3, 4, 5).

## Changes Made

### Frontend: CreativeAssetsStep.tsx (Lines 208-230)
Added detailed console logging to track task creation:
```typescript
console.log('📋 Task IDs received from backend:', taskIds);
console.log('📝 Created task objects:', newTasks.length, newTasks);
console.log('✅ Set active tasks to:', newTasks.length, 'tasks');
```

### Backend: creative_assets.py (Lines 549-648)
Added comprehensive logging throughout task creation:
```python
logger.info(f"🎯 Configured to generate {num_variations} {asset_type} variations")
logger.info(f"📝 Starting loop to create {num_variations} tasks...")
logger.info(f"🔄 Creating task {i+1}/{num_variations}...")
logger.info(f"✅ Created {asset_type} generation task {i+1}/{num_variations}: {task_id}")
logger.info(f"📊 Total tasks created so far: {len(task_ids)}")
logger.info(f"🎬 Finished task creation loop. Total tasks created: {len(task_ids)}/{num_variations}")
logger.info(f"🚀 Returning response with {len(task_ids)} task_ids: {task_ids}")
```

## What to Look For

When you run the generation again, check the browser console (F12 → Console tab) and backend logs:

### Expected Backend Logs:
```
🎯 Configured to generate 5 video variations
📝 Starting loop to create 5 tasks...
🔄 Creating task 1/5...
✅ Created video generation task 1/5: [task_id_1]
📊 Total tasks created so far: 1
🔄 Creating task 2/5...
✅ Created video generation task 2/5: [task_id_2]
📊 Total tasks created so far: 2
... (should continue to 5)
🎬 Finished task creation loop. Total tasks created: 5/5
🚀 Returning response with 5 task_ids: [all 5 task IDs]
```

### Expected Frontend Console Logs:
```
✓ Starting 5 video generations...
📋 Task IDs received from backend: [array with 5 task IDs]
📝 Created task objects: 5 [array with 5 GenerationTask objects]
✅ Set active tasks to: 5 tasks
```

## Diagnosis Scenarios

### Scenario 1: Backend Only Creates 2 Tasks
**Symptoms:** Backend logs show loop stopping at task 2/5
**Cause:** Runway ML API rate limiting or errors after 2 tasks
**Look for:** `❌ Failed to create variation` error messages
**Fix:** Check Runway ML API quota, add retry logic, or reduce concurrent task creation

### Scenario 2: Backend Creates 5 Tasks But Returns 2
**Symptoms:** Backend logs show 5 tasks created but response contains only 2
**Cause:** task_ids array being modified before return
**Look for:** Mismatch between "Total tasks created: 5" and "Returning response with 2 task_ids"
**Fix:** Check for code that filters or limits task_ids array

### Scenario 3: Frontend Receives 5 But Displays 2
**Symptoms:** Frontend logs show 5 task IDs received but only 2 in GenerationTask objects
**Cause:** Issue in newTasks.map() or setActiveTasks()
**Look for:** "Task IDs received: 5" but "Created task objects: 2"
**Fix:** Check taskIds.map() logic in startGeneration()

### Scenario 4: All 5 Created But UI Only Shows 2
**Symptoms:** All logs show 5 tasks but UI displays 2
**Cause:** React rendering issue or activeTasks being filtered
**Look for:** "Set active tasks to: 5 tasks" but UI shows 2
**Fix:** Check activeTasks.map() rendering logic (line 949) or React state updates

## Code References

### Task Creation Loop (Backend)
File: `/backend/app/api/AutoCreate/creative_assets.py`
Line: 570-630
Logic: Creates `num_variations` (5) tasks in a loop with try-catch

### Task Display (Frontend)
File: `/frontend/src/components/auto-create/CreativeAssetsStep.tsx`
Line: 949-975
Logic: Maps over `activeTasks` array to render each video status

### Task State Management
- `activeTasks` state: Line 52 - `useState<GenerationTask[]>([])`
- Set on generation start: Line 228 - `setActiveTasks(newTasks)`
- Updated during polling: Line 274 - Updates task status
- No filtering applied before rendering

## Next Steps

1. **Run Generation:** Click "Generate AI Videos" button
2. **Open Browser Console:** Press F12 → Console tab
3. **Check Backend Logs:** Look at terminal running Flask backend
4. **Compare Logs:** Match the expected patterns above
5. **Report Findings:** Share which scenario matches your logs

The detailed logging will pinpoint exactly where the issue occurs in the pipeline.
