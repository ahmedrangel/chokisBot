/**
 * Discord interactions manager
 */
import { InteractionResponseType, InteractionType, API } from "./lib/discord.js";
import { getFrom } from "./functions.js";

class JsonResponse extends Response {
  constructor(body, init) {
    const jsonBody = JSON.stringify(body);
    const options = init || {
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      }
    };
    super(jsonBody, options);
  }
}

class JsonRequest extends Request {
  constructor(url, body, init) {
    console.log(body);
    const options = {
      ...init,
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      }
    };
    super(url, options);
  }
}

class JsonFileRequest extends Request {
  constructor(url, body, init) {
    const formData = new FormData();
    const { files } = body;
    console.log(body);
    if (files) {
      files.forEach((file, i) => {
        formData.append(`files[${i}]`, file.file, file.name);
      });
    }
    delete body.files;
    formData.append("payload_json", JSON.stringify(body));
    const options = {
      ...init,
      body: formData
    };
    super(url, options);
  }
}

const toDiscord = (body, init) => {
  return new JsonResponse(body, init);
};

const toDiscordEndpoint = (endpoint, body, method) => {
  const endpoint_url = `${API.BASE}${endpoint}`;
  if (!body.files) {
    return fetch(new JsonRequest(endpoint_url, body, { method }));
  } else {
    return fetch(new JsonFileRequest(endpoint_url, body, { method }));
  }
};

const pong = () => {
  return toDiscord({
    type: InteractionResponseType.PONG,
  });
};

export const create = (type, options, func) => {
  switch (type) {
  case InteractionType.PING:
    return pong();
  case InteractionType.APPLICATION_COMMAND:
    return func({
      getValue: (name) => getFrom(name, options)
    });
  }
};

export const reply = (content, options) => {
  return toDiscord({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: content,
      embeds: options?.embeds,
      flags: options?.flags,
    },
  });
};

export const deferReply = (options) => {
  return toDiscord({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: options?.flags
    }
  });
};

export const deferUpdate = (content, options) => {
  const { token, application_id} = options;
  const followup_endpoint = `/webhooks/${application_id}/${token}`;
  return toDiscordEndpoint(followup_endpoint, {
    type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE,
    content: content,
    embeds: options?.embeds,
    components: options?.components,
    files: options?.files,
  }, "POST");
};

export const error = (message, code) => {
  return toDiscord({ error: message }, { status: code });
};
