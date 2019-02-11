import { List, InfiniteLoader } from 'react-virtualized';
import React, { useEffect, useRef, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getListHeight, getScrollIndex, getNextRowIndex } from '../../helpers/getters';
import { flatVirtualizedListRowRenderer } from './helpers/flat-list.jsx';

let ListVirtualized = (props) => {
  let queueScrollToIdx = undefined;
  let focusedItemIndex = undefined;

  const listComponent = useRef('virtualized-list');

  useEffect(() => {
    // only scroll to index when we have something in the queue of focused and not visible
    if (listComponent && queueScrollToIdx) {
      listComponent.current.scrollToRow(getNextRowIndex(focusedItemIndex, queueScrollToIdx, props.options));
      queueScrollToIdx = undefined;
    }
  });

  const onOptionFocused = ({ index, isVisible }) => {
    if (index !== undefined && isVisible) {
      focusedItemIndex = index;
    } else if (index !== undefined && !isVisible && !queueScrollToIdx) {
      queueScrollToIdx = index;
    }
  };

  const height = useMemo(
    () =>
      getListHeight({
        maxHeight: props.maxHeight,
        totalSize: props.children.length,
        optionHeight: props.optionHeight,
      }),
    [props.maxHeight, props.children.length, props.optionHeight],
  );

  const scrollToIndex = useMemo(
    () =>
      getScrollIndex({
        children: props.options,
        selected: props.selectedValue || props.defaultValue,
        valueGetter: props.valueGetter,
      }),
    [props.options, props.selectedValue, props.defaultValue],
  );

  const list = [];

  const rowRenderer = useMemo(
    () =>
      flatVirtualizedListRowRenderer({
        ...props,
        onOptionFocused: onOptionFocused,
      }),
    [list],
  );

  const isRowLoaded = ({ index }) => {
    return !!list[index];
  };

  const loadMoreRows = ({ startIndex, stopIndex }) => {
    console.log('loading more');

    return new Promise((resolve) => {
      setTimeout(() => {
        const result = list.concat(props.children.filter((el, index) => index >= startIndex && index < stopIndex));
        resolve(result);
      }, 10);
    });
  };

  return (
    <InfiniteLoader
      isRowLoaded={isRowLoaded}
      threshold={props.threshold}
      loadMoreRows={loadMoreRows}
      rowCount={props.children.length || 0}
      minimumBatchSize={props.minimumBatchSize}
    >
      {({ onRowsRendered, registerChild }) => (
        <List
          ref={registerChild}
          onRowsRendered={onRowsRendered}
          style={{ width: '100%' }}
          height={height}
          scrollToIndex={scrollToIndex}
          rowCount={props.children.length}
          rowHeight={props.optionHeight}
          rowRenderer={rowRenderer}
          width={props.maxWidth}
        />
      )}
    </InfiniteLoader>
  );
};

ListVirtualized = memo(ListVirtualized);

ListVirtualized.propTypes = {
  maxHeight: PropTypes.number, // this prop is coming from react-select
  maxWidth: PropTypes.number, // the style width 100% will override this prop, we need to set something big because it is a required field
  children: PropTypes.node.isRequired,
  optionHeight: PropTypes.number,
  selectedValue: PropTypes.object,
  defaultValue: PropTypes.object,
  valueGetter: PropTypes.func,
  options: PropTypes.array.isRequired,
  minimumBatchSize: PropTypes.number,
};

ListVirtualized.defaultProps = {
  valueGetter: (item) => item && item.value,
  maxWidth: 500,
  maxHeight: 200,
  minimumBatchSize: 500,
};

ListVirtualized.displayName = 'ListVirtualized';

export default ListVirtualized;