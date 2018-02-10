import { h, Component } from 'ink'
import PropTypes from 'prop-types'
import invariant from 'invariant'

function createBroadcast(initialValue) {
  let currentValue = initialValue
  let subscribers = []

  const getValue = () => currentValue

  const publish = state => {
    currentValue = state
    subscribers.forEach(s => s(currentValue))
  }

  const subscribe = subscriber => {
    subscribers.push(subscriber)

    return () => {
      subscribers = subscribers.filter(s => s !== subscriber)
    }
  }

  return {
    getValue,
    publish,
    subscribe
  }
}

/**
 * A <Broadcast> provides a generic way for descendants to "subscribe"
 * to some value that changes over time, bypassing any intermediate
 * shouldComponentUpdate's in the hierarchy. It puts all subscription
 * functions on context.broadcasts, keyed by "channel".
 *
 * To use it, a subscriber must opt-in to context.broadcasts. See the
 * <Subscriber> component for a reference implementation.
 */
export default class Broadcast extends Component {
  static propTypes = {
    channel: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    compareValues: PropTypes.func,
    value: PropTypes.any
  }

  static defaultProps = {
    compareValues: (prevValue, nextValue) => prevValue === nextValue
  }

  static contextTypes = {
    broadcasts: PropTypes.object
  }

  static childContextTypes = {
    broadcasts: PropTypes.object.isRequired
  }

  broadcast = createBroadcast(this.props.value)

  getChildContext() {
    return {
      broadcasts: {
        ...this.context.broadcasts,
        [this.props.channel]: this.broadcast
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    invariant(
      this.props.channel === nextProps.channel,
      'You cannot change <Broadcast channel>'
    )

    if (!this.props.compareValues(this.props.value, nextProps.value)) {
      this.broadcast.publish(nextProps.value)
    }
  }

  render() {
    return this.props.children
  }
}
