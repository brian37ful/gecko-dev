/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

/**
 * Tests markers filtering mechanism.
 */

function* spawnTest() {
  let { panel } = yield initPerformance(SIMPLE_URL);
  let { $, $$, EVENTS, PerformanceController, OverviewView, WaterfallView } = panel.panelWin;
  let { TimelineGraph } = devtools.require("devtools/performance/graphs");
  let { rowHeight: MARKERS_GRAPH_ROW_HEIGHT } = TimelineGraph.prototype;

  yield startRecording(panel);
  ok(true, "Recording has started.");

  yield waitUntil(() => {
    // Wait until we get 3 different markers.
    let markers = PerformanceController.getCurrentRecording().getMarkers();
    return markers.some(m => m.name == "Styles") &&
           markers.some(m => m.name == "Reflow") &&
           markers.some(m => m.name == "Paint");
  });

  yield stopRecording(panel);

  // Select everything
  OverviewView.setTimeInterval({ startTime: 0, endTime: Number.MAX_VALUE })

  $("#filter-button").click();
  let menuItem1 = $("menuitem[marker-type=Styles]");
  let menuItem2 = $("menuitem[marker-type=Reflow]");
  let menuItem3 = $("menuitem[marker-type=Paint]");

  let overview = OverviewView.graphs.get("timeline");
  let originalHeight = overview.fixedHeight;

  ok($(".waterfall-marker-bar[type=Styles]"), "Found at least one 'Styles' marker (1)");
  ok($(".waterfall-marker-bar[type=Reflow]"), "Found at least one 'Reflow' marker (1)");
  ok($(".waterfall-marker-bar[type=Paint]"), "Found at least one 'Paint' marker (1)");

  let heightBefore = overview.fixedHeight;
  EventUtils.synthesizeMouseAtCenter(menuItem1, {type: "mouseup"}, panel.panelWin);
  yield waitForOverviewAndCommand(overview, menuItem1);

  is(overview.fixedHeight, heightBefore, "Overview height hasn't changed");
  ok(!$(".waterfall-marker-bar[type=Styles]"), "No 'Styles' marker (2)");
  ok($(".waterfall-marker-bar[type=Reflow]"), "Found at least one 'Reflow' marker (2)");
  ok($(".waterfall-marker-bar[type=Paint]"), "Found at least one 'Paint' marker (2)");

  heightBefore = overview.fixedHeight;
  EventUtils.synthesizeMouseAtCenter(menuItem2, {type: "mouseup"}, panel.panelWin);
  yield waitForOverviewAndCommand(overview, menuItem2);

  is(overview.fixedHeight, heightBefore, "Overview height hasn't changed");
  ok(!$(".waterfall-marker-bar[type=Styles]"), "No 'Styles' marker (3)");
  ok(!$(".waterfall-marker-bar[type=Reflow]"), "No 'Reflow' marker (3)");
  ok($(".waterfall-marker-bar[type=Paint]"), "Found at least one 'Paint' marker (3)");

  heightBefore = overview.fixedHeight;
  EventUtils.synthesizeMouseAtCenter(menuItem3, {type: "mouseup"}, panel.panelWin);
  yield waitForOverviewAndCommand(overview, menuItem3);

  is(overview.fixedHeight, heightBefore - MARKERS_GRAPH_ROW_HEIGHT, "Overview is smaller");
  ok(!$(".waterfall-marker-bar[type=Styles]"), "No 'Styles' marker (4)");
  ok(!$(".waterfall-marker-bar[type=Reflow]"), "No 'Reflow' marker (4)");
  ok(!$(".waterfall-marker-bar[type=Paint]"), "No 'Paint' marker (4)");

  for (let item of [menuItem1, menuItem2, menuItem3]) {
    EventUtils.synthesizeMouseAtCenter(item, {type: "mouseup"}, panel.panelWin);
    yield waitForOverviewAndCommand(overview, item);
  }

  ok($(".waterfall-marker-bar[type=Styles]"), "Found at least one 'Styles' marker (5)");
  ok($(".waterfall-marker-bar[type=Reflow]"), "Found at least one 'Reflow' marker (5)");
  ok($(".waterfall-marker-bar[type=Paint]"), "Found at least one 'Paint' marker (5)");

  is(overview.fixedHeight, originalHeight, "Overview restored");

  yield teardown(panel);
  finish();
}

function waitForOverviewAndCommand(overview, item) {
  let overviewRendered = overview.once("refresh");
  let menuitemCommandDispatched = once(item, "command");
  return Promise.all([overviewRendered, menuitemCommandDispatched]);
}
